Page({
  data: {
    weather: null,
    loading: true,
    error: null,
    location: null,
    city: ''
  },

  onLoad: function() {
    this.initWeather();
  },

  initWeather: function() {
    this.setData({ loading: true, error: null });
    this.getLocationAndWeather();
  },

  getLocationAndWeather: function() {
    const that = this;
    
    wx.getLocation({
      type: 'wgs84',
      success: function(res) {
        that.setData({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        that.getWeatherFromCloud();
      },
      fail: function(err) {
        console.error('获取位置失败', err);
        that.handleLocationError(err);
      }
    });
  },

  handleLocationError: function(err) {
    const that = this;
    
    if (err.errMsg && err.errMsg.includes('auth deny')) {
      wx.showModal({
        title: '需要位置授权',
        content: '为了提供准确的天气信息，需要获取您的位置信息。请在设置中开启位置权限。',
        confirmText: '去设置',
        success: function(res) {
          if (res.confirm) {
            wx.openSetting({
              success: function(settingRes) {
                if (settingRes.authSetting['scope.userLocation']) {
                  that.getLocationAndWeather();
                } else {
                  that.getWeatherWithDefaultCity();
                }
              },
              fail: function() {
                that.getWeatherWithDefaultCity();
              }
            });
          } else {
            that.getWeatherWithDefaultCity();
          }
        }
      });
    } else {
      that.getWeatherWithDefaultCity();
    }
  },

  getWeatherWithDefaultCity: function() {
    this.setData({ city: '北京市' });
    this.getWeatherFromCloud();
  },

  getWeatherFromCloud: function() {
    const that = this;
    const { location, city } = this.data;

    wx.cloud.callFunction({
      name: 'silveasyFunctions',
      data: {
        action: 'getWeather',
        latitude: location?.latitude,
        longitude: location?.longitude,
        city: city
      },
      success: function(res) {
        if (res.result.success) {
          that.setData({
            weather: res.result.data,
            loading: false,
            error: null
          });
        } else {
          that.setData({
            loading: false,
            error: res.result.message || '获取天气信息失败'
          });
        }
      },
      fail: function(err) {
        console.error('调用云函数失败', err);
        that.setData({
          loading: false,
          error: '网络请求失败，请稍后重试'
        });
      }
    });
  },

  onRefresh: function() {
    this.initWeather();
  },

  onSelectCity: function() {
    const that = this;
    wx.showActionSheet({
      itemList: ['北京市', '上海市', '广州市', '深圳市', '杭州市'],
      success: function(res) {
        const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市'];
        that.setData({
          city: cities[res.tapIndex],
          location: null
        });
        that.initWeather();
      }
    });
  }
});
