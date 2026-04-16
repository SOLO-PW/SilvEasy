Page({
  data: {
    contacts: [],
    loading: true,
    isAssistanceMode: false,
    elderId: null,
    elderName: ''
  },

  onLoad: function(options) {
    if (options.elderId) {
      this.setData({
        isAssistanceMode: true,
        elderId: options.elderId,
        elderName: decodeURIComponent(options.elderName || '长辈')
      })
      this.verifyBindingAndLoadContacts()
    } else {
      this.setData({
        isAssistanceMode: false
      })
      this.loadContacts()
    }
  },

  onShow: function() {
    if (this.data.isAssistanceMode) {
      this.verifyBindingAndLoadContacts()
    } else {
      this.loadContacts()
    }
  },

  verifyBindingAndLoadContacts: async function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      this.setData({ 
        loading: false,
        contacts: []
      });
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    try {
      this.setData({ loading: true })
      const { result } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'getElderContacts',
          elderId: this.data.elderId
        }
      })

      if (result.success) {
        this.setData({
          contacts: result.contacts,
          loading: false
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (err) {
      console.error('加载联系人失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  loadContacts: function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      this.setData({ 
        loading: false,
        contacts: []
      });
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    
    const db = wx.cloud.database()
    this.setData({ loading: true })
    wx.cloud.callFunction({
      name: 'silveasyFunctions',
      data: {
        action: 'getOrCreateUser'
      }
    }).then(res => {
      if (res.result.success) {
        const userId = res.result.user._id
        db.collection('contacts')
          .where({
            userId: userId
          })
          .orderBy('createTime', 'desc')
          .get()
          .then(res => {
            this.setData({
              contacts: res.data,
              loading: false
            })
          })
          .catch(err => {
            this.setData({ loading: false })
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            })
          })
      } else {
        this.setData({ loading: false })
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ loading: false })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    })
  },

  onAddContact: function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    
    let url = '/pages/contact-edit/index'
    if (this.data.isAssistanceMode) {
      url += `?elderId=${this.data.elderId}&elderName=${encodeURIComponent(this.data.elderName)}`
    }
    wx.navigateTo({
      url: url
    })
  },

  onEditContact: function(e) {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    
    const id = e.currentTarget.dataset.id
    let url = `/pages/contact-edit/index?id=${id}`
    if (this.data.isAssistanceMode) {
      url += `&elderId=${this.data.elderId}&elderName=${encodeURIComponent(this.data.elderName)}`
    }
    wx.navigateTo({
      url: url
    })
  },

  onDeleteContact: function(e) {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'none'
      });
      return;
    }
    
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个联系人吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          if (this.data.isAssistanceMode) {
            try {
              const { result } = await wx.cloud.callFunction({
                name: 'silveasyFunctions',
                data: {
                  action: 'deleteElderContact',
                  elderId: this.data.elderId,
                  contactId: id
                }
              })
              
              wx.hideLoading()
              if (result.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.verifyBindingAndLoadContacts()
              } else {
                wx.showToast({
                  title: result.message || '删除失败',
                  icon: 'none'
                })
              }
            } catch (err) {
              wx.hideLoading()
              wx.showToast({
                title: '网络错误',
                icon: 'none'
              })
            }
          } else {
            const db = wx.cloud.database()
            db.collection('contacts').doc(id).remove()
              .then(() => {
                wx.hideLoading()
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.loadContacts()
              })
              .catch(err => {
                wx.hideLoading()
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                })
              })
          }
        }
      }
    })
  },

  onMakeCall: function(e) {
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    }
  }
})
