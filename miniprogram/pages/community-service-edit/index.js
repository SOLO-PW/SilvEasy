const db = wx.cloud.database()

Page({
  data: {
    serviceId: null,
    name: '',
    phone: '',
    address: '',
    category: 'community',
    icon: '',
    currentUserId: null,
    categories: [
      { id: 'community', name: '社区服务', icon: '🏘️' },
      { id: 'health', name: '医疗健康', icon: '🏥' },
      { id: 'life', name: '生活服务', icon: '🛒' },
      { id: 'government', name: '政务服务', icon: '🏛️' }
    ],
    icons: ['🏘️', '🏥', '🛒', '🏛️', '📞', '🚑', '🚒', '🚓', '🏪', '🏠', '🏢', '💊', '🛠️', '📦', '🍜'],
    loading: false,
    isEdit: false
  },

  onLoad: function(options) {
    this.loadCurrentUser()
    
    if (options.id) {
      this.setData({
        serviceId: options.id,
        isEdit: true
      })
      this.loadServiceDetail(options.id)
    }
  },

  loadCurrentUser: async function() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: { action: 'getOrCreateUser' }
      })
      
      if (result.success) {
        this.setData({ currentUserId: result.user._id })
      }
    } catch (err) {
      console.error('加载用户信息失败', err)
    }
  },

  loadServiceDetail: async function(id) {
    try {
      wx.showLoading({ title: '加载中...' })
      const res = await db.collection('community_services').doc(id).get()
      wx.hideLoading()
      
      if (res.data) {
        this.setData({
          name: res.data.name || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          category: res.data.category || 'community',
          icon: res.data.icon || ''
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('加载服务详情失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  onNameInput: function(e) {
    this.setData({ name: e.detail.value })
  },

  onPhoneInput: function(e) {
    this.setData({ phone: e.detail.value })
  },

  onAddressInput: function(e) {
    this.setData({ address: e.detail.value })
  },

  onCategoryChange: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ category: category })
  },

  onIconSelect: function(e) {
    const icon = e.currentTarget.dataset.icon
    this.setData({ icon: icon })
  },

  onSave: async function() {
    if (!this.data.name) {
      wx.showToast({
        title: '请输入服务名称',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.phone) {
      wx.showToast({
        title: '请输入电话号码',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true })
      wx.showLoading({ title: '保存中...' })
      
      let result
      
      if (this.data.isEdit) {
        result = await wx.cloud.callFunction({
          name: 'silveasyFunctions',
          data: {
            action: 'updateCommunityService',
            serviceId: this.data.serviceId,
            elderId: this.data.currentUserId,
            name: this.data.name,
            phone: this.data.phone,
            address: this.data.address,
            category: this.data.category,
            icon: this.data.icon
          }
        })
      } else {
        result = await wx.cloud.callFunction({
          name: 'silveasyFunctions',
          data: {
            action: 'addCommunityService',
            elderId: this.data.currentUserId,
            name: this.data.name,
            phone: this.data.phone,
            address: this.data.address,
            category: this.data.category,
            icon: this.data.icon
          }
        })
      }
      
      wx.hideLoading()
      this.setData({ loading: false })
      
      if (result.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.result.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      this.setData({ loading: false })
      console.error('保存服务失败', err)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  }
})
