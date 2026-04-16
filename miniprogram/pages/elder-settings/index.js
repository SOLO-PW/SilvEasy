const db = wx.cloud.database()

Page({
  data: {
    bindCode: null,
    expireTime: null,
    loading: false,
    countingDown: false,
    countdownSeconds: 0
  },

  onLoad: function() {
    this.checkCurrentBindCode()
  },

  checkCurrentBindCode: async function() {
    try {
      const { result: userInfo } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'getOrCreateUser'
        }
      })

      if (userInfo.success) {
        const userId = userInfo.user._id
        const now = new Date()
        
        const res = await db.collection('binding_codes')
          .where({
            elderUserId: userId,
            expireTime: db.command.gt(now),
            used: false
          })
          .orderBy('createTime', 'desc')
          .limit(1)
          .get()

        if (res.data.length > 0) {
          const codeData = res.data[0]
          this.setData({
            bindCode: codeData.code,
            expireTime: codeData.expireTime
          })
          this.startCountdown(codeData.expireTime)
        }
      }
    } catch (err) {
      console.error('检查绑定码失败', err)
    }
  },

  startCountdown: function(expireTime) {
    const expire = new Date(expireTime)
    const now = new Date()
    const diff = Math.floor((expire - now) / 1000)

    if (diff > 0) {
      this.setData({
        countingDown: true,
        countdownSeconds: diff
      })

      this.countdownTimer = setInterval(() => {
        const newCount = this.data.countdownSeconds - 1
        if (newCount <= 0) {
          clearInterval(this.countdownTimer)
          this.setData({
            countingDown: false,
            countdownSeconds: 0,
            bindCode: null,
            expireTime: null
          })
        } else {
          this.setData({ countdownSeconds: newCount })
        }
      }, 1000)
    }
  },

  onUnload: function() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },

  generateBindCode: async function() {
    this.setData({ loading: true })

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'generateBindCode'
        }
      })

      if (result.success) {
        this.setData({
          bindCode: result.code,
          expireTime: result.expireTime
        })
        this.startCountdown(result.expireTime)
        wx.showToast({
          title: '生成成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: result.message || '生成失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('生成绑定码失败', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  copyBindCode: function() {
    if (this.data.bindCode) {
      wx.setClipboardData({
        data: this.data.bindCode,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          })
        }
      })
    }
  },

  formatCountdown: function(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
})
