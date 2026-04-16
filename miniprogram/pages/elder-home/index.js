Page({
  data: {
    currentDate: '',
    currentTime: '',
    emergencyContacts: [],
    loadingContacts: true
  },

  onLoad: function() {
    this.updateDateTime();
    this.timer = setInterval(() => {
      this.updateDateTime();
    }, 60000);
    this.loadEmergencyContacts();
  },

  onShow: function() {
    this.loadEmergencyContacts();
  },

  onUnload: function() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  updateDateTime: function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[now.getDay()];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    this.setData({
      currentDate: `${year}年${month}月${day}日 ${weekDay}`,
      currentTime: `${hours}:${minutes}`
    });
  },

  loadEmergencyContacts: function() {
    const app = getApp();
    if (!app.globalData.cloudInitialized) {
      this.setData({ 
        loadingContacts: false,
        emergencyContacts: []
      });
      console.warn('云开发环境未初始化，无法加载紧急联系人');
      return;
    }
    
    const db = wx.cloud.database()
    this.setData({ loadingContacts: true })
    db.collection('contacts')
      .where({
        tag: '紧急联系人'
      })
      .get()
      .then(res => {
        this.setData({
          emergencyContacts: res.data,
          loadingContacts: false
        })
      })
      .catch(err => {
        this.setData({ loadingContacts: false })
        console.error('加载紧急联系人失败', err)
      })
  },

  makeCall: function(e) {
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      })
    }
  },

  goToWeather: function() {
    wx.navigateTo({
      url: '/pages/weather/index'
    });
  },

  goToBus: function() {
    wx.navigateTo({
      url: '/pages/bus/index'
    });
  },

  goToCommunity: function() {
    wx.navigateTo({
      url: '/pages/community/index'
    });
  },

  goToContacts: function() {
    wx.navigateTo({
      url: '/pages/contacts/index'
    });
  },

  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/elder-settings/index'
    });
  }
})