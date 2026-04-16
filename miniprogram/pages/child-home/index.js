const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    elderList: [],
    loading: true
  },

  onLoad: function() {
    this.checkUserAndLoadElders()
  },

  onShow: function() {
    this.checkUserAndLoadElders()
  },

  checkUserAndLoadElders: async function() {
    try {
      const { result: userInfo } = await wx.cloud.callFunction({
        name: 'silveasyFunctions',
        data: {
          action: 'getOrCreateUser'
        }
      })
      
      if (userInfo.success) {
        this.setData({ userId: userInfo.user._id })
        this.loadElders()
      } else {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('获取用户信息失败', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  loadElders: function() {
    this.setData({ loading: true })
    
    db.collection('bindings')
      .where({
        childId: this.data.userId,
        status: 'confirmed'
      })
      .get()
      .then(async res => {
        const bindings = res.data
        
        if (bindings.length === 0) {
          this.setData({ elderList: [], loading: false })
          return
        }
        
        const elderIds = bindings.map(binding => binding.elderId)
        const usersRes = await db.collection('users')
          .where({
            _id: _.in(elderIds)
          })
          .get()
        
        const elderList = bindings.map(binding => {
          const user = usersRes.data.find(u => u._id === binding.elderId)
          return {
            ...binding,
            nickname: user?.nickname || '长辈',
            avatarUrl: user?.avatarUrl || '',
            phone: user?.phone || ''
          }
        })
        
        this.setData({ elderList, loading: false })
      })
      .catch(err => {
        console.error('加载长辈列表失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      })
  },

  goToBindElder: function() {
    wx.navigateTo({
      url: '/pages/bind-elder/index'
    })
  },

  goToElderManage: function(e) {
    const elderId = e.currentTarget.dataset.elderId
    wx.navigateTo({
      url: `/pages/elder-manage/index?elderId=${elderId}`
    })
  },

  makeCall: function(e) {
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    }
  }
})
