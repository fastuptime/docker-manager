let currentTemplate = null;

async function loadMarketTemplates() {
    try {
        const response = await fetch('/api/market/templates');
        const data = await response.json();
        const container = document.getElementById('market-templates');
        if (container && data.success) {
            container.innerHTML = data.data.map(app => `
                <div class="bg-white/90 backdrop-blur-xl rounded-xl p-6 shadow-glass border border-white/20 hover:shadow-glow transition-all duration-300">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                                <i class="${app.icon} text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-dark-800">${app.name}</h3>
                                <span class="text-xs text-dark-500">${app.image}</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-dark-600 mb-4">${app.description}</p>
                    <div class="flex items-center justify-between">
                        <div class="text-xs text-dark-500">
                            ${app.ports.length > 0 ? `Port: ${app.ports[0].host}` : 'Dahili'}
                        </div>
                        <button onclick="openInstallModal('${app.id}')" 
                                class="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                            <i class="fas fa-download mr-2"></i>Kur
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Şablonlar yüklenemedi:', error);
        showNotification('Şablonlar yüklenemedi', 'error');
    }
}

async function openInstallModal(templateId) {
    try {
        const response = await fetch('/api/market/templates');
        const data = await response.json();
        const template = data.data.find(t => t.id === templateId);

        if (!template) {
            showNotification('Şablon bulunamadı', 'error');
            return;
        }

        currentTemplate = template;

        const modalContent = `
            <div class="bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md mx-4 shadow-glass border border-white/20 animate-scale-in">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-dark-800">${template.name} Kurulumu</h3>
                    <button onclick="closeInstallModal()" class="text-dark-500 hover:text-dark-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form id="install-form" onsubmit="installApp(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-dark-700 mb-1">Container Adı</label>
                            <input type="text" id="container-name" 
                                   value="${template.id}-${Date.now()}" 
                                   class="w-full px-3 py-2 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/80 backdrop-blur-sm">
                        </div>

                        ${template.env.map(envVar => `
                            <div>
                                <label class="block text-sm font-medium text-dark-700 mb-1">
                                    ${envVar.label} ${envVar.required ? '*' : ''}
                                </label>
                                <input type="${envVar.key.toLowerCase().includes('password') ? 'password' : 'text'}" 
                                       name="${envVar.key}" 
                                       ${envVar.required ? 'required' : ''}
                                       class="w-full px-3 py-2 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/80 backdrop-blur-sm">
                            </div>
                        `).join('')}

                        ${template.ports.length > 0 ? `
                            <div>
                                <label class="block text-sm font-medium text-dark-700 mb-1">Host Port</label>
                                <input type="number" id="host-port" 
                                       value="${template.ports[0].host}" 
                                       class="w-full px-3 py-2 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/80 backdrop-blur-sm">
                            </div>
                        ` : ''}
                    </div>

                    <div class="flex justify-end space-x-2 pt-6">
                        <button type="button" onclick="closeInstallModal()" 
                                class="px-4 py-2 text-dark-600 hover:text-dark-800 transition-colors">
                            İptal
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                            <i class="fas fa-download mr-2"></i>Kur
                        </button>
                    </div>
                </form>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'install-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

    } catch (error) {
        console.error('Modal açılamadı:', error);
        showNotification('Kurulum ekranı açılamadı', 'error');
    }
}

function closeInstallModal() {
    const modal = document.getElementById('install-modal');
    if (modal) {
        modal.remove();
    }
    currentTemplate = null;
}

async function installApp(event) {
    event.preventDefault();

    if (!currentTemplate) {
        showNotification('Şablon bulunamadı', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const name = document.getElementById('container-name').value;
    const hostPort = document.getElementById('host-port')?.value;

    const env = [];
    currentTemplate.env.forEach(envVar => {
        const value = formData.get(envVar.key);
        if (value) {
            env.push(`${envVar.key}=${value}`);
        }
    });

    const ports = currentTemplate.ports.map(port => ({
        container: port.container,
        host: hostPort ? parseInt(hostPort) : port.host
    }));

    try {
        const response = await fetch('/api/market/install', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                templateId: currentTemplate.id,
                name,
                env,
                ports
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            closeInstallModal();

            if (typeof loadDashboard === 'function') {
                loadDashboard();
            }
        } else {
            showNotification(result.error || 'Kurulum başarısız', 'error');
        }
    } catch (error) {
        console.error('Kurulum hatası:', error);
        showNotification('Kurulum sırasında hata oluştu', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('market-templates')) {
        loadMarketTemplates();
    }
});