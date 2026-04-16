Page({
  data: {
    activeTab: 'nearby',
    loading: false,
    nearbyStations: [],
    lineNumber: '',
    lineDetail: null,
    hasSearched: false
  },

  mockStations: [
    {
      id: 1,
      name: '人民广场站',
      distance: '200米',
      lines: ['1路', '5路', '12路']
    },
    {
      id: 2,
      name: '市政府站',
      distance: '350米',
      lines: ['3路', '8路', '15路', '22路']
    },
    {
      id: 3,
      name: '中心医院站',
      distance: '500米',
      lines: ['2路', '7路', '18路']
    },
    {
      id: 4,
      name: '火车站',
      distance: '800米',
      lines: ['1路', '4路', '6路', '10路', '25路']
    }
  ],

  mockLines: {
    '1路': {
      name: '1路公交车',
      start: '火车站',
      end: '高新区',
      first: '06:00',
      last: '22:30',
      stations: ['火车站', '人民广场', '市政府', '中心医院', '商业街', '大学', '科技园', '高新区']
    },
    '5路': {
      name: '5路公交车',
      start: '汽车东站',
      end: '汽车西站',
      first: '06:30',
      last: '21:30',
      stations: ['汽车东站', '体育馆', '人民广场', '图书馆', '博物馆', '汽车西站']
    },
    '12路': {
      name: '12路公交车',
      start: '南城区',
      end: '北城区',
      first: '06:00',
      last: '22:00',
      stations: ['南城区', '公园南门', '人民广场', '公园北门', '北城区']
    }
  },

  onLoad: function() {
    this.getNearbyStations();
  },

  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  getNearbyStations: function() {
    this.setData({
      loading: true
    });

    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        console.log('位置获取成功', res);
        this.loadNearbyStations();
      },
      fail: (err) => {
        console.log('位置获取失败', err);
        wx.showToast({
          title: '使用模拟数据',
          icon: 'none'
        });
        this.loadNearbyStations();
      }
    });
  },

  loadNearbyStations: function() {
    setTimeout(() => {
      this.setData({
        nearbyStations: this.mockStations,
        loading: false
      });
    }, 1000);
  },

  refreshNearby: function() {
    this.getNearbyStations();
    wx.showToast({
      title: '正在刷新...',
      icon: 'loading',
      duration: 1000
    });
  },

  onInput: function(e) {
    this.setData({
      lineNumber: e.detail.value
    });
  },

  searchLine: function() {
    const lineNum = this.data.lineNumber.trim();
    if (!lineNum) {
      wx.showToast({
        title: '请输入线路号',
        icon: 'none'
      });
      return;
    }

    let key = lineNum;
    if (!key.endsWith('路')) {
      key = key + '路';
    }

    const lineDetail = this.mockLines[key];
    
    this.setData({
      lineDetail: lineDetail || null,
      hasSearched: true
    });

    if (!lineDetail) {
      wx.showToast({
        title: '未找到该线路',
        icon: 'none'
      });
    }
  }
})
