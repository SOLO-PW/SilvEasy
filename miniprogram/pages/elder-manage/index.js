Page({
  data: {
    elderId: '',
    elderInfo: null,
    loading: true
  },

  formatDate: function(date) {
    if (!date) return '未知'
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    return date
  },

  onLoad: function(options) {
    if (options.elderId) {
      this.setData({ elderId: options.elderId })
      this.loadElderInfo()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  loadElderInfo: async function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }
    
    try {
      const db = wx.cloud.database()
      const res = await db.collection('users')
        .doc(this.data.elderId)
        .get()
      
      const elderInfo = res.data
      if (elderInfo.createTime) {
        elderInfo.formattedCreateTime = this.formatDate(elderInfo.createTime)
      } else {
        elderInfo.formattedCreateTime = '未知'
      }
      this.setData({
        elderInfo,
        loading: false
      })
    } catch (err) {
      console.error('加载长辈信息失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  makeCall: function() {
    if (this.data.elderInfo?.phone) {
      wx.makePhoneCall({
        phoneNumber: this.data.elderInfo.phone
      })
    }
  },

  manageContacts: function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/contacts/index?elderId=${this.data.elderId}&elderName=${encodeURIComponent(this.data.elderInfo.nickname || '长辈')}`
    })
  },

  manageCommunityServices: function() {
    wx.navigateTo({
      url: '/pages/community/index'
    })
  },

  unbindElder: function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认解绑',
      content: '确定要与该长辈解除绑定吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const { result } = await wx.cloud.callFunction({
              name: 'silveasyFunctions',
              data: {
                action: 'unbindElder',
                elderId: this.data.elderId
              }
            })

            if (result.success) {
              wx.showToast({
                title: '解绑成功',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: result.message || '解绑失败',
                icon: 'none'
              })
            }
          } catch (err) {
            console.error('解绑失败', err)
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
