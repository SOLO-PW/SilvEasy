const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const https = require('https');

const getOpenId = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

const getOrCreateUser = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const usersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (usersRes.data.length > 0) {
      return {
        success: true,
        user: usersRes.data[0]
      };
    }

    const userInfo = event.userInfo || {};
    const newUser = {
      openid,
      nickname: userInfo.nickName || '用户',
      avatarUrl: userInfo.avatarUrl || '',
      phone: '',
      role: event.role || 'elder',
      createTime: new Date(),
      updateTime: new Date()
    };

    const addRes = await db.collection('users').add({
      data: newUser
    });

    newUser._id = addRes._id;

    return {
      success: true,
      user: newUser
    };
  } catch (error) {
    console.error('获取或创建用户失败', error);
    return {
      success: false,
      message: '获取用户信息失败'
    };
  }
};

const generateBindCode = async () => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const usersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (usersRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const elderUserId = usersRes.data[0]._id;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const addRes = await db.collection('binding_codes').add({
      data: {
        code,
        elderUserId,
        expireTime,
        used: false,
        createTime: new Date(),
        updateTime: new Date()
      }
    });

    return {
      success: true,
      code,
      expireTime,
      id: addRes._id
    };
  } catch (error) {
    console.error('生成绑定码失败', error);
    return {
      success: false,
      message: '生成绑定码失败'
    };
  }
};

const bindElder = async (event) => {
  try {
    const { bindCode, relation } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '子女用户不存在'
      };
    }

    const childUser = childUsersRes.data[0];
    const childId = childUser._id;

    const now = new Date();
    const codeRes = await db.collection('binding_codes')
      .where({
        code: bindCode,
        expireTime: _.gt(now),
        used: false
      })
      .get();

    if (codeRes.data.length === 0) {
      return {
        success: false,
        message: '绑定码无效或已过期'
      };
    }

    const bindingCode = codeRes.data[0];
    const elderId = bindingCode.elderUserId;

    if (elderId === childId) {
      return {
        success: false,
        message: '不能绑定自己'
      };
    }

    const existingBinding = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (existingBinding.data.length > 0) {
      return {
        success: false,
        message: '已经绑定过该长辈'
      };
    }

    const transaction = await db.startTransaction();

    try {
      await transaction.collection('bindings').add({
        data: {
          childId,
          elderId,
          relation: relation || '长辈',
          status: 'confirmed',
          createTime: new Date(),
          updateTime: new Date()
        }
      });

      await transaction.collection('binding_codes').doc(bindingCode._id).update({
        data: {
          used: true,
          updateTime: new Date()
        }
      });

      await transaction.commit();

      return {
        success: true,
        message: '绑定成功'
      };
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error('绑定长辈失败', error);
    return {
      success: false,
      message: '绑定失败，请重试'
    };
  }
};

const unbindElder = async (event) => {
  try {
    const { elderId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '子女用户不存在'
      };
    }

    const childId = childUsersRes.data[0]._id;

    const bindingRes = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return {
        success: false,
        message: '绑定关系不存在'
      };
    }

    await db.collection('bindings').doc(bindingRes.data[0]._id).remove();

    return {
      success: true,
      message: '解绑成功'
    };
  } catch (error) {
    console.error('解绑失败', error);
    return {
      success: false,
      message: '解绑失败，请重试'
    };
  }
};

const getWeather = async (event) => {
  try {
    const { latitude, longitude, city } = event;
    
    const useMockData = true;

    if (useMockData) {
      return {
        success: true,
        data: {
          city: city || '北京市',
          temperature: 22,
          weather: '晴',
          weatherIcon: '☀️',
          windDirection: '东南风',
          windLevel: '3级',
          humidity: 45,
          aqi: 65,
          aqiLevel: '良',
          updateTime: new Date().toLocaleString('zh-CN'),
          forecast: [
            { date: '今天', weather: '晴', tempHigh: 26, tempLow: 18, icon: '☀️' },
            { date: '明天', weather: '多云', tempHigh: 24, tempLow: 17, icon: '⛅' },
            { date: '后天', weather: '小雨', tempHigh: 20, tempLow: 15, icon: '🌧️' }
          ]
        }
      };
    }

    const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';
    
    let locationParam = '';
    if (latitude && longitude) {
      locationParam = `${longitude},${latitude}`;
    } else if (city) {
      locationParam = city;
    } else {
      return {
        success: false,
        message: '缺少位置参数'
      };
    }

    const url = `https://devapi.qweather.com/v7/weather/now?location=${encodeURIComponent(locationParam)}&key=${WEATHER_API_KEY}`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const weatherData = JSON.parse(data);
            if (weatherData.code === '200') {
              const now = weatherData.now;
              resolve({
                success: true,
                data: {
                  city: weatherData.location?.name || city || '未知城市',
                  temperature: parseInt(now.temp),
                  weather: now.text,
                  weatherIcon: getWeatherIcon(now.text),
                  windDirection: now.windDir,
                  windLevel: now.windScale + '级',
                  humidity: parseInt(now.humidity),
                  updateTime: new Date().toLocaleString('zh-CN')
                }
              });
            } else {
              resolve({
                success: false,
                message: '获取天气失败: ' + weatherData.code
              });
            }
          } catch (e) {
            resolve({
              success: false,
              message: '解析天气数据失败'
            });
          }
        });
      }).on('error', (err) => {
        resolve({
          success: false,
          message: '请求天气API失败'
        });
      });
    });
  } catch (error) {
    console.error('获取天气失败', error);
    return {
      success: false,
      message: '获取天气失败，请重试'
    };
  }
};

const getWeatherIcon = (weatherText) => {
  const iconMap = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌧️',
    '中雨': '🌧️',
    '大雨': '🌧️',
    '阵雨': '🌦️',
    '雷阵雨': '⛈️',
    '雪': '❄️',
    '小雪': '❄️',
    '中雪': '❄️',
    '大雪': '❄️'
  };
  return iconMap[weatherText] || '🌤️';
};

const verifyBinding = async (event) => {
  try {
    const { elderId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const childId = childUsersRes.data[0]._id;

    const bindingRes = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return {
        success: false,
        message: '未绑定该长辈'
      };
    }

    const elderUserRes = await db.collection('users')
      .doc(elderId)
      .get();

    if (!elderUserRes.data) {
      return {
        success: false,
        message: '长辈用户不存在'
      };
    }

    return {
      success: true,
      elderUser: elderUserRes.data,
      binding: bindingRes.data[0]
    };
  } catch (error) {
    console.error('验证绑定关系失败', error);
    return {
      success: false,
      message: '验证失败'
    };
  }
};

const getElderContacts = async (event) => {
  try {
    const { elderId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const childId = childUsersRes.data[0]._id;

    const bindingRes = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return {
        success: false,
        message: '未绑定该长辈'
      };
    }

    const contactsRes = await db.collection('contacts')
      .where({
        userId: elderId
      })
      .orderBy('createTime', 'desc')
      .get();

    return {
      success: true,
      contacts: contactsRes.data
    };
  } catch (error) {
    console.error('获取联系人失败', error);
    return {
      success: false,
      message: '获取联系人失败'
    };
  }
};

const addElderContact = async (event) => {
  try {
    const { elderId, name, phone, tag, relation, isEmergency } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const childId = childUsersRes.data[0]._id;

    const bindingRes = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return {
        success: false,
        message: '未绑定该长辈'
      };
    }

    const newContact = {
      userId: elderId,
      name: name,
      phone: phone,
      tag: tag || '',
      relation: relation || '',
      isEmergency: isEmergency || false,
      createTime: new Date(),
      updateTime: new Date()
    };

    const addRes = await db.collection('contacts').add({
      data: newContact
    });

    newContact._id = addRes._id;

    return {
      success: true,
      contact: newContact,
      message: '添加成功'
    };
  } catch (error) {
    console.error('添加联系人失败', error);
    return {
      success: false,
      message: '添加联系人失败'
    };
  }
};

const updateElderContact = async (event) => {
  try {
    const { elderId, contactId, name, phone, tag, relation, isEmergency } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const childId = childUsersRes.data[0]._id;

    const bindingRes = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return {
        success: false,
        message: '未绑定该长辈'
      };
    }

    const contactRes = await db.collection('contacts')
      .doc(contactId)
      .get();

    if (!contactRes.data || contactRes.data.userId !== elderId) {
      return {
        success: false,
        message: '联系人不存在或无权限'
      };
    }

    const updateData = {
      updateTime: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (tag !== undefined) updateData.tag = tag;
    if (relation !== undefined) updateData.relation = relation;
    if (isEmergency !== undefined) updateData.isEmergency = isEmergency;

    await db.collection('contacts').doc(contactId).update({
      data: updateData
    });

    return {
      success: true,
      message: '更新成功'
    };
  } catch (error) {
    console.error('更新联系人失败', error);
    return {
      success: false,
      message: '更新联系人失败'
    };
  }
};

const deleteElderContact = async (event) => {
  try {
    const { elderId, contactId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const childUsersRes = await db.collection('users')
      .where({ openid })
      .get();

    if (childUsersRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const childId = childUsersRes.data[0]._id;

    const bindingRes = await db.collection('bindings')
      .where({
        childId,
        elderId,
        status: 'confirmed'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return {
        success: false,
        message: '未绑定该长辈'
      };
    }

    const contactRes = await db.collection('contacts')
      .doc(contactId)
      .get();

    if (!contactRes.data || contactRes.data.userId !== elderId) {
      return {
        success: false,
        message: '联系人不存在或无权限'
      };
    }

    await db.collection('contacts').doc(contactId).remove();

    return {
      success: true,
      message: '删除成功'
    };
  } catch (error) {
    console.error('删除联系人失败', error);
    return {
      success: false,
      message: '删除联系人失败'
    };
  }
};

exports.main = async (event, context) => {
  switch (event.action || event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getOrCreateUser":
      return await getOrCreateUser(event);
    case "generateBindCode":
      return await generateBindCode();
    case "bindElder":
      return await bindElder(event);
    case "unbindElder":
      return await unbindElder(event);
    case "getWeather":
      return await getWeather(event);
    case "verifyBinding":
      return await verifyBinding(event);
    case "getElderContacts":
      return await getElderContacts(event);
    case "addElderContact":
      return await addElderContact(event);
    case "updateElderContact":
      return await updateElderContact(event);
    case "deleteElderContact":
      return await deleteElderContact(event);
    default:
      return {
        success: false,
        errMsg: "Unknown operation type"
      };
  }
};
