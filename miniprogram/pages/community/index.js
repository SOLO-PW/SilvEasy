const db = wx.cloud.database()

Page({
  data: {
    categories: [
      { id: 'community', name: '社区服务', icon: '🏘️', color: '#3498db' },
      { id: 'health', name: '医疗健康', icon: '🏥', color: '#e74c3c' },
      { id: 'life', name: '生活服务', icon: '🛒', color: '#27ae60' },
      { id: 'government', name: '政务服务', icon: '🏛️', color: '#9b59b6' }
    ],
    activeCategory: 'community',
    services: [],
    loading: true,
    currentUserId: null,
    userRole: null
  },

  onLoad: function() {
    this.loadCurrentUser()
  },

  onShow: function() {
    if (this.data.currentUserId) {
      this.loadServices()
    }
  },

  loadCurrentUser: async function() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: { action: 'getOrCreateUser' }
      })
      
      if (result.success) {
        this.setData({
          currentUserId: result.user._id,
          userRole: result.user.role
        })
        this.loadServices()
      }
    } catch (err) {
      console.error('加载用户信息失败', err)
      this.setData({ loading: false })
    }
  },

  loadServices: async function() {
    this.setData({ loading: true })
    
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'getCommunityServices',
          elderId: this.data.currentUserId,
          category: this.data.activeCategory
        }
      })
      
      if (result.success) {
        this.setData({
          services: result.services,
          loading: false
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('加载社区服务失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  onCategoryChange: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    this.loadServices()
  },

  makeCall: function(e) {
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    }
  },

  onAddService: function() {
    wx.navigateTo({
      url: '/pages/community-service-edit/index'
    })
  },

  onEditService: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/community-service-edit/index?id=${id}`
    })
  },

  onDeleteService: function(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个服务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })
            const { result } = await wx.cloud.callFunction({
              name: 'silveasyFunctions',
              data: {
                action: 'deleteCommunityService',
                serviceId: id,
                elderId: this.data.currentUserId
              }
            })
            wx.hideLoading()
            
            if (result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadServices()
            } else {
              wx.showToast({
                title: result.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (err) {
            wx.hideLoading()
            console.error('删除服务失败', err)
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
