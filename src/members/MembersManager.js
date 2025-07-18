// Members management without mock data
export class MembersManager {
    constructor() {
        this.members = [];
        this.filteredMembers = [];
    }
    
    init() {
        this.renderMembers();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const searchInput = document.querySelector('#membersScreen input[placeholder="Search members..."]');
        const roleSelect = document.querySelector('#membersScreen select');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterMembers(e.target.value, roleSelect?.value || 'All Roles');
            });
        }
        
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                this.filterMembers(searchInput?.value || '', e.target.value);
            });
        }
    }
    
    filterMembers(searchTerm, role) {
        this.filteredMembers = this.members.filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                member.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = role === 'All Roles' || member.role === role;
            return matchesSearch && matchesRole;
        });
        this.renderMembers();
    }
    
    renderMembers() {
        const container = document.getElementById('membersList');
        if (!container) return;
        
        if (this.filteredMembers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <i class="fas fa-user w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 mb-4">No team members found</p>
                    <p class="text-sm text-gray-400">Invite team members to start collaborating</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.filteredMembers.map(member => `
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div class="grid grid-cols-12 gap-4 items-center">
                    <div class="col-span-4 flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span class="text-sm font-medium text-gray-600">
                                ${member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">${member.name}</div>
                            <div class="text-sm text-gray-500">${member.email}</div>
                        </div>
                    </div>
                    <div class="col-span-2">
                        <div class="flex items-center gap-2">
                            ${this.getRoleIcon(member.role)}
                            <span class="text-sm text-gray-900">${member.role}</span>
                        </div>
                    </div>
                    <div class="col-span-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getStatusColor(member.status)}">
                            ${member.status}
                        </span>
                    </div>
                    <div class="col-span-3">
                        <span class="text-sm text-gray-500">${member.lastActive}</span>
                    </div>
                    <div class="col-span-1">
                        <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="window.membersManager.showMemberActions('${member.id}')">
                            <i class="fas fa-ellipsis-h w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getRoleIcon(role) {
        switch (role) {
            case 'Admin': return '<i class="fas fa-shield-alt w-4 h-4 text-red-500"></i>';
            case 'Editor': return '<i class="fas fa-edit w-4 h-4 text-blue-500"></i>';
            case 'Viewer': return '<i class="fas fa-eye w-4 h-4 text-gray-500"></i>';
            default: return '<i class="fas fa-user w-4 h-4 text-gray-500"></i>';
        }
    }
    
    getStatusColor(status) {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    async loadMembers() {
        try {
            // This would typically fetch from an API
            // const response = await fetch('/api/members');
            // this.members = await response.json();
            this.members = []; // Start with empty array
            this.filterMembers('', 'All Roles');
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }
    
    async addMember(memberData) {
        try {
            // This would typically POST to an API
            // const response = await fetch('/api/members', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(memberData)
            // });
            // const newMember = await response.json();
            
            const newMember = {
                id: Date.now().toString(),
                ...memberData,
                lastActive: 'Never',
                status: 'Pending'
            };
            
            this.members.push(newMember);
            this.filterMembers('', 'All Roles');
            
            if (window.navigationManager) {
                window.navigationManager.showNotification('Member invited successfully', 'success');
            }
        } catch (error) {
            console.error('Error adding member:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to invite member', 'error');
            }
        }
    }
    
    async removeMember(memberId) {
        try {
            // This would typically DELETE from an API
            // await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
            
            this.members = this.members.filter(m => m.id !== memberId);
            this.filterMembers('', 'All Roles');
            
            if (window.navigationManager) {
                window.navigationManager.showNotification('Member removed successfully', 'success');
            }
        } catch (error) {
            console.error('Error removing member:', error);
            if (window.navigationManager) {
                window.navigationManager.showNotification('Failed to remove member', 'error');
            }
        }
    }
    
    showMemberActions(memberId) {
        // Show context menu or modal for member actions
        if (window.navigationManager) {
            window.navigationManager.showNotification('Member management features coming soon', 'info');
        }
    }
}