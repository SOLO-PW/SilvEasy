const db = wx.cloud.database()

Page({
  data: {
    bindCode: '',
    loading: false,
    relationList: ['父亲', '母亲', '岳父', '岳母', '爷爷', '奶奶', '外公', '外婆', '其他'],
    selectedRelation: '父亲'
  },

  onLoad: function() {
  },

  onBindCodeInput: function(e) {
    this.setData({
      bindCode: e.detail.value.replace(/\D/g, '').slice(0, 6)
    })
  },

  selectRelation: function(e) {
    const index = e.detail.value
    this.setData({
      selectedRelation: this.data.relationList[index]
    })
  },

  bindElder: async function() {
    if (!this.data.bindCode || this.data.bindCode.length !== 6) {
      wx.showToast({
        title: '请输入6位绑定码',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'bindElder',
          bindCode: this.data.bindCode,
          relation: this.data.selectedRelation
        }
      })

      if (result.success) {
        wx.showToast({
          title: '绑定成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.message || '绑定失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('绑定失败', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
