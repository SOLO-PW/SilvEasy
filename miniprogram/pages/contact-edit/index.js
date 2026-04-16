const db = wx.cloud.database()

Page({
  data: {
    id: null,
    name: '',
    phone: '',
    tag: '',
    tags: [
      { value: '儿子', label: '儿子' },
      { value: '女儿', label: '女儿' },
      { value: '紧急联系人', label: '紧急联系人' },
      { value: '亲戚', label: '亲戚' },
      { value: '朋友', label: '朋友' },
      { value: '邻居', label: '邻居' }
    ],
    tagIndex: 0,
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
    } else {
      this.setData({
        isAssistanceMode: false
      })
    }

    if (options.id) {
      this.setData({ id: options.id })
      this.loadContact(options.id)
    }
  },

  loadContact: function(id) {
    if (this.data.isAssistanceMode) {
      this.setData({ loading: true })
      wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'getElderContacts',
          elderId: this.data.elderId
        }
      }).then(res => {
        if (res.result.success) {
          const contact = res.result.contacts.find(c => c._id === id)
          if (contact) {
            const tagIndex = this.data.tags.findIndex(t => t.value === contact.tag)
            this.setData({
              name: contact.name,
              phone: contact.phone,
              tag: contact.tag,
              tagIndex: tagIndex >= 0 ? tagIndex : 0,
              loading: false
            })
          } else {
            this.setData({ loading: false })
            wx.showToast({
              title: '联系人不存在',
              icon: 'none'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        } else {
          this.setData({ loading: false })
          wx.showToast({
            title: res.result.message || '加载失败',
            icon: 'none'
          })
        }
      }).catch(err => {
        console.error('加载联系人失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      })
    } else {
      db.collection('contacts').doc(id).get()
        .then(res => {
          const contact = res.data
          const tagIndex = this.data.tags.findIndex(t => t.value === contact.tag)
          this.setData({
            name: contact.name,
            phone: contact.phone,
            tag: contact.tag,
            tagIndex: tagIndex >= 0 ? tagIndex : 0
          })
        })
        .catch(err => {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        })
    }
  },

  onNameInput: function(e) {
    this.setData({ name: e.detail.value })
  },

  onPhoneInput: function(e) {
    this.setData({ phone: e.detail.value })
  },

  onTagChange: function(e) {
    const index = e.detail.value
    this.setData({
      tagIndex: index,
      tag: this.data.tags[index].value
    })
  },

  onSave: async function() {
    const { id, name, phone, tag, isAssistanceMode, elderId } = this.data

    if (!name || !name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      })
      return
    }

    if (!phone || !phone.trim()) {
      wx.showToast({
        title: '请输入电话',
        icon: 'none'
      })
      return
    }

    if (!tag) {
      wx.showToast({
        title: '请选择标签',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    if (isAssistanceMode) {
      try {
        let result
        if (id) {
          result = await wx.cloud.callFunction({
            name: 'silveasyFunctions',
            data: {
              action: 'updateElderContact',
              elderId: elderId,
              contactId: id,
              name: name.trim(),
              phone: phone.trim(),
              tag: tag
            }
          })
        } else {
          result = await wx.cloud.callFunction({
            name: 'silveasyFunctions',
            data: {
              action: 'addElderContact',
              elderId: elderId,
              name: name.trim(),
              phone: phone.trim(),
              tag: tag
            }
          })
        }

        wx.hideLoading()
        if (result.result.success) {
          wx.showToast({
            title: id ? '保存成功' : '添加成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1000)
        } else {
          wx.showToast({
            title: result.result.message || '保存失败',
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
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        tag: tag,
        updateTime: db.serverDate()
      }

      if (id) {
        db.collection('contacts').doc(id).update({
          data: data
        }).then(() => {
          wx.hideLoading()
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1000)
        }).catch(err => {
          wx.hideLoading()
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        })
      } else {
        wx.cloud.callFunction({
          name: 'silveasyFunctions',
          data: {
            action: 'getOrCreateUser'
          }
        }).then(res => {
          if (res.result.success) {
            data.userId = res.result.user._id
            data.createTime = db.serverDate()
            db.collection('contacts').add({
              data: data
            }).then(() => {
              wx.hideLoading()
              wx.showToast({
                title: '添加成功',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1000)
            }).catch(err => {
              wx.hideLoading()
              wx.showToast({
                title: '添加失败',
                icon: 'none'
              })
            })
          } else {
            wx.hideLoading()
            wx.showToast({
              title: '获取用户信息失败',
              icon: 'none'
            })
          }
        }).catch(err => {
          wx.hideLoading()
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
        })
      }
    }
  },

  onCancel: function() {
    wx.navigateBack()
  }
})
