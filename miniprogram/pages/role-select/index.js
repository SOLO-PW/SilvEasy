Page({
  selectRole: function(e) {
    const role = e.currentTarget.dataset.role;
    
    wx.setStorageSync('userRole', role);
    
    if (role === 'elder') {
      wx.redirectTo({
        url: '/pages/elder-home/index'
      });
    } else if (role === 'child') {
      wx.redirectTo({
        url: '/pages/child-home/index'
      });
    }
  }
})
