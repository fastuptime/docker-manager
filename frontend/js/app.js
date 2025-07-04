let socket = null;
let isLogFollowing = true;
let currentLogContainer = null;
let refreshInterval = null;
document.addEventListener("DOMContentLoaded", function () {
    initializeApp();
});
function initializeApp() {
    socket = io();
    setupNavigation();
    setupSocketListeners();
    setupFormListeners();
    loadDashboard();
    setupAutoRefresh();
    showDashboard();
}
function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.addEventListener("click", function (e) {
            e.preventDefault();

            navItems.forEach((i) => {
                i.classList.remove("active", "bg-white/60", "text-primary-600");
            });
            this.classList.add("active", "bg-white/60", "text-primary-600");
        });
    });
}
function setupSocketListeners() {
    socket.on("connect", () => {
        console.log("Connected to server");
        showNotification("Connected to Docker Manager", "success");
    });
    socket.on("disconnect", () => {
        console.log("Disconnected from server");
        showNotification("Disconnected from server", "error");
    });
    socket.on("container-log", (data) => {
        const logsContainer = document.getElementById("logs-container");
        if (logsContainer && currentLogContainer === data.containerId) {
            logsContainer.innerHTML += data.log;
            if (isLogFollowing) {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
        }
    });
    socket.on("error", (error) => {
        console.error("Socket error:", error);
        showNotification(error.message, "error");
    });
}
function setupFormListeners() {
    const containerForm = document.getElementById("container-form");
    if (containerForm) {
        containerForm.addEventListener("submit", function (e) {
            e.preventDefault();
            createContainerSubmit();
        });
    }
    const imageForm = document.getElementById("image-form");
    if (imageForm) {
        imageForm.addEventListener("submit", function (e) {
            e.preventDefault();
            pullImageSubmit();
        });
    }
    const networkForm = document.getElementById("network-form");
    if (networkForm) {
        networkForm.addEventListener("submit", function (e) {
            e.preventDefault();
            createNetworkSubmit();
        });
    }
    const volumeForm = document.getElementById("volume-form");
    if (volumeForm) {
        volumeForm.addEventListener("submit", function (e) {
            e.preventDefault();
            createVolumeSubmit();
        });
    }
}
function setupAutoRefresh() {
    refreshInterval = setInterval(() => {
        const activeSection = document.querySelector(".section:not(.hidden)");
        if (activeSection) {
            const sectionId = activeSection.id;
            switch (sectionId) {
                case "dashboard-section":
                    loadDashboard();
                    break;
                case "containers-section":
                    loadContainers();
                    break;
                case "images-section":
                    loadImages();
                    break;
                case "networks-section":
                    loadNetworks();
                    break;
                case "volumes-section":
                    loadVolumes();
                    break;
            }
        }
    }, 30000); 
}

function showSection(sectionId) {

    const sections = document.querySelectorAll(".section");
    sections.forEach((section) => {
        section.classList.add("hidden");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove("hidden");
        targetSection.classList.add("animate-fade-in");
    }
}

function updatePageTitle(title, subtitle) {
    document.getElementById("page-title").textContent = title;
    document.getElementById("page-subtitle").textContent = subtitle;
}

function showDashboard() {
    showSection("dashboard-section");
    updatePageTitle("Dashboard", "Docker ortamına genel bakış");
    loadDashboard();
}

async function loadDashboard() {
    try {
        const response = await fetch("/api/system/info");
        const data = await response.json();

        if (data.success) {
            updateSystemInfo(data.data);
            updateStats(data.data);
            updateRecentActivity();
        }
    } catch (error) {
        console.error("Error loading dashboard:", error);
        showNotification("Dashboard yüklenirken hata oluştu", "error");
    }
}

function updateSystemInfo(data) {
    document.getElementById("docker-version").textContent = data.ServerVersion || "-";
    document.getElementById("api-version").textContent = data.ApiVersion || "-";
    document.getElementById("os-info").textContent = data.OperatingSystem || "-";
    document.getElementById("arch-info").textContent = data.Architecture || "-";
}

function updateStats(data) {

    const containersCount = data.Containers || 0;
    const runningContainers = data.ContainersRunning || 0;

    document.getElementById("containers-count").textContent = containersCount;
    document.getElementById("running-containers").textContent = runningContainers;

    const containersProgress = containersCount > 0 ? (runningContainers / containersCount) * 100 : 0;
    document.getElementById("containers-progress").style.width = containersProgress + "%";

    const imagesCount = data.Images || 0;
    document.getElementById("images-count").textContent = imagesCount;
    document.getElementById("images-size").textContent = formatBytes(data.ImageSize || 0);

    const imagesProgress = Math.min(imagesCount * 10, 100);
    document.getElementById("images-progress").style.width = imagesProgress + "%";

    document.getElementById("networks-count").textContent = data.Networks || 0;
    document.getElementById("networks-type").textContent = "Custom";

    const networksProgress = Math.min((data.Networks || 0) * 20, 100);
    document.getElementById("networks-progress").style.width = networksProgress + "%";

    document.getElementById("volumes-count").textContent = data.Volumes || 0;
    document.getElementById("volumes-size").textContent = formatBytes(data.VolumesSize || 0);

    const volumesProgress = Math.min((data.Volumes || 0) * 25, 100);
    document.getElementById("volumes-progress").style.width = volumesProgress + "%";
}

async function updateRecentActivity() {
    try {
        const response = await fetch('/api/activities');
        const data = await response.json();
        const activities = data.activities || [];
        const container = document.getElementById("recent-activity");
        if (container) {
            if (activities.length === 0) {
                container.innerHTML = '<div class="text-sm text-dark-500">Aktivite yok</div>';
            } else {
                container.innerHTML = activities
                    .map(
                        (activity) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-${activity.type} text-${activity.color}-600 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-dark-800">${activity.title}</p>
                                <p class="text-xs text-dark-500">${activity.subtitle}</p>
                            </div>
                        </div>
                        <span class="text-xs text-dark-500">${activity.time}</span>
                    </div>
                `
                    )
                    .join("");
            }
        }
    } catch (error) {
        console.error("Aktiviteler alınamadı:", error);
    }
}

function showContainers() {
    showSection("containers-section");
    updatePageTitle("Containers", "Container yönetimi ve izleme");
    loadContainers();
}

async function loadContainers() {
    try {
        const response = await fetch("/api/containers");
        const data = await response.json();

        if (data.success) {
            updateContainersTable(data.data);
        }
    } catch (error) {
        console.error("Error loading containers:", error);
        showNotification("Containers yüklenirken hata oluştu", "error");
    }
}

function updateContainersTable(containers) {
    const tbody = document.getElementById("containers-table");
    tbody.innerHTML = "";

    containers.forEach((container) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/50 transition-colors";

        const statusClass = getStatusClass(container.state || container.State);
        const statusText = getStatusText(container.state || container.State);

        row.innerHTML = `
            <td class="p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full ${statusClass}"></div>
                    <span class="font-medium text-dark-800">${container.name}</span>
                </div>
            </td>
            <td class="p-4 text-dark-600">${container.image}</td>
            <td class="p-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${(container.state || container.State || "").toLowerCase()}">
                    ${statusText}
                </span>
            </td>
            <td class="p-4 text-dark-600">${formatPorts(container.ports)}</td>
            <td class="p-4 text-dark-600">${formatDate(container.created)}</td>
            <td class="p-4">
                <div class="flex space-x-2">
                    ${
                        (container.state || container.State) === "running"
                            ? `<button onclick="stopContainer('${container.id}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs rounded-lg">
                            <i class="fas fa-stop"></i>
                        </button>`
                            : `<button onclick="startContainer('${container.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs rounded-lg">
                            <i class="fas fa-play"></i>
                        </button>`
                    }
                    <button onclick="removeContainer('${container.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="viewContainerLogs('${container.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showImages() {
    showSection("images-section");
    updatePageTitle("Images", "Docker image yönetimi");
    loadImages();
}

async function loadImages() {
    try {
        const response = await fetch("/api/images");
        const data = await response.json();

        if (data.success) {
            updateImagesTable(data.data);
        }
    } catch (error) {
        console.error("Error loading images:", error);
        showNotification("Images yüklenirken hata oluştu", "error");
    }
}

function updateImagesTable(images) {
    const tbody = document.getElementById("images-table");
    tbody.innerHTML = "";

    images.forEach((image) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/50 transition-colors";

        const repoTag = image.repoTags && image.repoTags[0] ? image.repoTags[0].split(":") : ["<none>", "<none>"];

        row.innerHTML = `
            <td class="p-4 font-medium text-dark-800">${repoTag[0]}</td>
            <td class="p-4 text-dark-600">${repoTag[1]}</td>
            <td class="p-4 text-dark-600 font-mono text-sm">${image.id.substring(7, 19)}</td>
            <td class="p-4 text-dark-600">${formatBytes(image.size)}</td>
            <td class="p-4 text-dark-600">${formatDate(image.created)}</td>
            <td class="p-4">
                <div class="flex space-x-2">
                    <button onclick="removeImage('${image.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="inspectImage('${image.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showNetworks() {
    showSection("networks-section");
    updatePageTitle("Networks", "Docker network yönetimi");
    loadNetworks();
}

async function loadNetworks() {
    try {
        const response = await fetch("/api/networks");
        const data = await response.json();

        if (data.success) {
            updateNetworksTable(data.data);
        }
    } catch (error) {
        console.error("Error loading networks:", error);
        showNotification("Networks yüklenirken hata oluştu", "error");
    }
}

function updateNetworksTable(networks) {
    const tbody = document.getElementById("networks-table");
    tbody.innerHTML = "";

    networks.forEach((network) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/50 transition-colors";

        const subnet = network.ipam && network.ipam.Config && network.ipam.Config[0] ? network.ipam.Config[0].Subnet : "N/A";

        row.innerHTML = `
            <td class="p-4 font-medium text-dark-800">${network.name}</td>
            <td class="p-4 text-dark-600">${network.driver}</td>
            <td class="p-4 text-dark-600">${network.scope}</td>
            <td class="p-4 text-dark-600">${subnet}</td>
            <td class="p-4 text-dark-600">${formatDate(network.created)}</td>
            <td class="p-4">
                <div class="flex space-x-2">
                    ${
                        !["bridge", "host", "none"].includes(network.name)
                            ? `<button onclick="removeNetwork('${network.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-lg">
                            <i class="fas fa-trash"></i>
                        </button>`
                            : ""
                    }
                    <button onclick="inspectNetwork('${network.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function showVolumes() {
    showSection("volumes-section");
    updatePageTitle("Volumes", "Docker volume yönetimi");
    loadVolumes();
}

async function loadVolumes() {
    try {
        const response = await fetch("/api/volumes");
        const data = await response.json();

        if (data.success) {
            updateVolumesTable(data.data);
        }
    } catch (error) {
        console.error("Error loading volumes:", error);
        showNotification("Volumes yüklenirken hata oluştu", "error");
    }
}

function updateVolumesTable(volumes) {
    const tbody = document.getElementById("volumes-table");
    tbody.innerHTML = "";

    volumes.forEach((volume) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/50 transition-colors";

        row.innerHTML = `
            <td class="p-4 font-medium text-dark-800">${volume.name}</td>
            <td class="p-4 text-dark-600">${volume.driver}</td>
            <td class="p-4 text-dark-600 text-xs">${volume.mountpoint || "N/A"}</td>
            <td class="p-4 text-dark-600">${formatDate(volume.created)}</td>
            <td class="p-4">
                <div class="flex space-x-2">
                    <button onclick="removeVolume('${volume.name}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="inspectVolume('${volume.name}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-lg">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

async function startContainer(containerId) {
    try {
        const response = await fetch(`/api/containers/${containerId}/start`, {
            method: "POST",
        });
        const data = await response.json();

        if (response.ok) {
            showNotification("Container başarıyla başlatıldı", "success");
            loadContainers();
        } else {
            showNotification(data.error || "Container başlatılırken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error starting container:", error);
        showNotification("Container başlatılırken hata oluştu", "error");
    }
}

async function stopContainer(containerId) {
    try {
        const response = await fetch(`/api/containers/${containerId}/stop`, {
            method: "POST",
        });
        const data = await response.json();

        if (response.ok) {
            showNotification("Container başarıyla durduruldu", "success");
            loadContainers();
        } else {
            showNotification(data.error || "Container durdurulurken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error stopping container:", error);
        showNotification("Container durdurulurken hata oluştu", "error");
    }
}

async function removeContainer(containerId) {
    const result = await showConfirm("Container Sil", "Bu container'ı silmek istediğinizden emin misiniz?");
    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/api/containers/${containerId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (response.ok) {
            showNotification("Container başarıyla silindi", "success");
            loadContainers();
        } else {
            showNotification(data.error || "Container silinirken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error removing container:", error);
        showNotification("Container silinirken hata oluştu", "error");
    }
}

function followLogs(containerId) {
    showLogs();
    currentLogContainer = containerId;
    isLogFollowing = true;
    socket.emit('follow-logs', containerId);
}

async function fetchLogs(containerId) {
    showLogs();
    currentLogContainer = containerId;
    isLogFollowing = false;
    try {
        const response = await fetch(`/api/containers/${containerId}/logs`);
        const data = await response.json();
        const logsContainer = document.getElementById("logs-container");
        if (logsContainer) {
            logsContainer.innerHTML = data.logs || "Log bulunamadı";
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    } catch (error) {
        showNotification("Log alınırken hata oluştu", "error");
    }
}

async function removeImage(imageId) {
    const result = await showConfirm("Image Sil", "Bu image'ı silmek istediğinizden emin misiniz?");
    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/api/images/${imageId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (response.ok) {
            showNotification("Image başarıyla silindi", "success");
            loadImages();
        } else {
            showNotification(data.error || "Image silinirken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error removing image:", error);
        showNotification("Image silinirken hata oluştu", "error");
    }
}

async function inspectImage(imageId) {
    try {
        const response = await fetch(`/api/images/${imageId}/inspect`);
        const data = await response.json();

        if (response.ok) {
            showInfo("Image Detayları", data.data);
        } else {
            showNotification(data.error || "Image detayları alınırken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error inspecting image:", error);
        showNotification("Image detayları alınırken hata oluştu", "error");
    }
}

async function removeNetwork(networkId) {
    const result = await showConfirm("Network Sil", "Bu network'ü silmek istediğinizden emin misiniz?");
    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/api/networks/${networkId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (response.ok) {
            showNotification("Network başarıyla silindi", "success");
            loadNetworks();
        } else {
            showNotification(data.error || "Network silinirken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error removing network:", error);
        showNotification("Network silinirken hata oluştu", "error");
    }
}

async function inspectNetwork(networkId) {
    try {
        const response = await fetch(`/api/networks/${networkId}/inspect`);
        const data = await response.json();

        if (response.ok) {
            showInfo("Network Detayları", data.data);
        } else {
            showNotification(data.error || "Network detayları alınırken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error inspecting network:", error);
        showNotification("Network detayları alınırken hata oluştu", "error");
    }
}

async function removeVolume(volumeName) {
    const result = await showConfirm("Volume Sil", "Bu volume'ü silmek istediğinizden emin misiniz?");
    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`/api/volumes/${volumeName}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (response.ok) {
            showNotification("Volume başarıyla silindi", "success");
            loadVolumes();
        } else {
            showNotification(data.error || "Volume silinirken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error removing volume:", error);
        showNotification("Volume silinirken hata oluştu", "error");
    }
}

async function inspectVolume(volumeName) {
    try {
        const response = await fetch(`/api/volumes/${volumeName}/inspect`);
        const data = await response.json();

        if (response.ok) {
            showInfo("Volume Detayları", data.data);
        } else {
            showNotification(data.error || "Volume detayları alınırken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error inspecting volume:", error);
        showNotification("Volume detayları alınırken hata oluştu", "error");
    }
}

function createContainer() {
    document.getElementById("container-modal").classList.remove("hidden");
}

function pullImage() {
    document.getElementById("image-modal").classList.remove("hidden");
}

function createNetwork() {
    document.getElementById("network-modal").classList.remove("hidden");
}

function createVolume() {
    document.getElementById("volume-modal").classList.remove("hidden");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
}

async function createContainerSubmit() {
    const name = document.getElementById("container-name").value;
    const image = document.getElementById("container-image").value;
    const ports = document.getElementById("container-ports").value;

    if (!name || !image) {
        showNotification("Lütfen tüm alanları doldurun", "error");
        return;
    }

    try {
        const response = await fetch("/api/containers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                image: image,
                ports: ports,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("Container başarıyla oluşturuldu", "success");
            closeModal("container-modal");
            loadContainers();
            document.getElementById("container-form").reset();
        } else {
            showNotification(data.error || "Container oluşturulurken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error creating container:", error);
        showNotification("Container oluşturulurken hata oluştu", "error");
    }
}

async function pullImageSubmit() {
    const imageName = document.getElementById("image-name").value;

    if (!imageName) {
        showNotification("Lütfen image adını girin", "error");
        return;
    }

    try {
        showNotification("Image çekiliyor, lütfen bekleyin...", "info");

        const response = await fetch("/api/images/pull", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: imageName,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("Image başarıyla çekildi", "success");
            closeModal("image-modal");
            loadImages();
            document.getElementById("image-form").reset();
        } else {
            showNotification(data.error || "Image çekilirken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error pulling image:", error);
        showNotification("Image çekilirken hata oluştu", "error");
    }
}

async function createNetworkSubmit() {
    const name = document.getElementById("network-name").value;
    const driver = document.getElementById("network-driver").value;

    if (!name) {
        showNotification("Lütfen network adını girin", "error");
        return;
    }

    try {
        const response = await fetch("/api/networks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                driver: driver,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("Network başarıyla oluşturuldu", "success");
            closeModal("network-modal");
            loadNetworks();
            document.getElementById("network-form").reset();
        } else {
            showNotification(data.error || "Network oluşturulurken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error creating network:", error);
        showNotification("Network oluşturulurken hata oluştu", "error");
    }
}

async function createVolumeSubmit() {
    const name = document.getElementById("volume-name").value;
    const driver = document.getElementById("volume-driver").value;

    if (!name) {
        showNotification("Lütfen volume adını girin", "error");
        return;
    }

    try {
        const response = await fetch("/api/volumes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                driver: driver,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("Volume başarıyla oluşturuldu", "success");
            closeModal("volume-modal");
            loadVolumes();
            document.getElementById("volume-form").reset();
        } else {
            showNotification(data.error || "Volume oluşturulurken hata oluştu", "error");
        }
    } catch (error) {
        console.error("Error creating volume:", error);
        showNotification("Volume oluşturulurken hata oluştu", "error");
    }
}

function refreshData() {
    const activeSection = document.querySelector(".section:not(.hidden)");
    if (activeSection) {
        const sectionId = activeSection.id;
        switch (sectionId) {
            case "dashboard-section":
                loadDashboard();
                break;
            case "containers-section":
                loadContainers();
                break;
            case "images-section":
                loadImages();
                break;
            case "networks-section":
                loadNetworks();
                break;
            case "volumes-section":
                loadVolumes();
                break;
        }
    }
    showNotification("Veriler yenilendi", "success");
}

function showLogs() {
    showSection("logs-section");
    updatePageTitle("Logs", "Container logları");
}

function showMarket() {
    showSection("market-section");
    updatePageTitle("Market", "Docker uygulama marketi");
}

function clearLogs() {
    const logsContainer = document.getElementById("logs-container");
    if (logsContainer) {
        logsContainer.innerHTML = "Container seçin ve log görüntüleme tipini belirleyin...";
        showNotification("Loglar temizlendi", "success");
    }
}

function toggleAutoScroll() {
    isLogFollowing = !isLogFollowing;
    const button = document.querySelector('[onclick="toggleAutoScroll()"]');
    if (isLogFollowing) {
        button.classList.add("bg-green-500");
        button.classList.remove("bg-primary-500");
        showNotification("Otomatik kaydırma açık", "info");
    } else {
        button.classList.remove("bg-green-500");
        button.classList.add("bg-primary-500");
        showNotification("Otomatik kaydırma kapalı", "info");
    }
}

function getStatusClass(state) {
    switch (state?.toLowerCase()) {
        case "running":
            return "bg-green-500";
        case "exited":
            return "bg-red-500";
        case "created":
            return "bg-blue-500";
        case "paused":
            return "bg-yellow-500";
        default:
            return "bg-gray-500";
    }
}

function getStatusText(state) {
    switch (state?.toLowerCase()) {
        case "running":
            return "Çalışıyor";
        case "exited":
            return "Durduruldu";
        case "created":
            return "Oluşturuldu";
        case "paused":
            return "Duraklatıldı";
        default:
            return "Bilinmiyor";
    }
}

function showNotification(message, type = "info") {
    if (typeof Swal === "undefined") {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }

    const config = {
        title: type === "error" ? "Hata!" : type === "success" ? "Başarılı!" : type === "warning" ? "Uyarı!" : "Bilgi",
        text: message,
        icon: type === "error" ? "error" : type === "success" ? "success" : type === "warning" ? "warning" : "info",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    };

    Swal.fire(config);
}

function showConfirm(title, text, confirmButtonText = "Evet", cancelButtonText = "İptal") {
    if (typeof Swal === "undefined") {
        return Promise.resolve({ isConfirmed: confirm(`${title}\n${text}`) });
    }

    return Swal.fire({
        title: title,
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
    });
}

function showInfo(title, content) {
    if (typeof Swal === "undefined") {
        alert(`${title}\n${JSON.stringify(content, null, 2)}`);
        return;
    }

    Swal.fire({
        title: title,
        html: `<pre class="text-left text-sm bg-gray-100 p-4 rounded max-h-96 overflow-auto">${JSON.stringify(content, null, 2)}</pre>`,
        width: "800px",
        showCloseButton: true,
        showConfirmButton: false,
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatPorts(ports) {
    if (!ports || ports.length === 0) return "-";
    return ports
        .map((port) => {
            if (port.PublicPort && port.PrivatePort) {
                return `${port.PublicPort}:${port.PrivatePort}`;
            }
            return port.PrivatePort || "-";
        })
        .join(", ");
}

document.addEventListener("click", function (event) {
    const modals = document.querySelectorAll('[id$="-modal"]');
    modals.forEach((modal) => {
        if (event.target === modal) {
            modal.classList.add("hidden");
        }
    });
});

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        const modals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
        modals.forEach((modal) => {
            modal.classList.add("hidden");
        });
    }

    if (event.ctrlKey && event.key === "r") {
        event.preventDefault();
        refreshData();
    }
});