// var lg = log4web.newLogger();
// var ui = window['log4web-ui-mobile'];

// lg.config({
//   level: log4web.LogLevel.TRACE,
//   // level: log4web.LogLevel.ERROR,
//   defaultStore: {
//     enable: true,
//   },
//   defaultFanner: {
//     enable: false
//   },
//   'log4web-ui-mobile': {}
// })
// lg.use(ui.Core); //使用默认的输出插件(console/alert)

// lg.setSpinBackColor('red');
// lg.showFloatSpin();

var resources = {
  start: undefined,
  score: undefined,
}

function loadImg(url, cb) {
  var img = new Image(); // 创建img元素
  img.onload = function () {
    // 执行drawImage语句
    cb && cb();
  }
  img.crossOrigin = "Anonymous";
  img.src = url; // 设置图片源地址
  return img;
}

//这里也可以修改成整体项目使用的资源加载器来实现预加载。这里简单写一下
function loadRes(cb) {
  resources.score = loadImg('/img/score-bg.png', () => {
    resources.start = loadImg('/img/start.png', () => {
      cb && cb();
    })
  })
}

var _requestAnimationFrame = window.requestAnimationFrame;



var config = {
  // clock: 1000, // 控制动画帧率。如果是undefined,默认requestAnimationFrame，否则使用计时器(duration=clock)
  canvas: {
    width: 0,
    height: 0,
    useDpr: 1, //当前画布使用的dpr (只有使用高清模式会改变)
  },
  getLevelConfig: function (line) {
    let levelConfig = config
      .level
      .filter((l) => {
        return (line >= (l.from == undefined ?
          0 :
          l.from)) && (line <= (l.to == undefined ?
          Infinity :
          l.to))
      })[0];
    return levelConfig;
  },
  addGradients: false, //此开关控制是否在画面上绘制渐变的装饰性圆点

  //如果开关打开，下面配置的渐变圆点会绘制
  gradients: [{
      x0: 310,
      y0: 160,
      r0: 10,
      x1: 310,
      y1: 160,
      r1: 0,
      shadowBlur: 40,
    },
    {
      x0: 210,
      y0: 180,
      r0: 30,
      x1: 210,
      y1: 180,
      r1: 0,
      shadowBlur: 10,
    },
    {
      x0: 230,
      y0: 270,
      r0: 25,
      x1: 230,
      y1: 270,
      r1: 0,
      shadowBlur: 10,
    },
    {
      x0: 45,
      y0: 370,
      r0: 110,
      x1: 45,
      y1: 370,
      r1: 0,
      shadowBlur: 90,
    },
    {
      x0: 330,
      y0: 360,
      r0: 20,
      x1: 330,
      y1: 360,
      r1: 0,
      shadowBlur: 10,
    },
    {
      x0: 320,
      y0: 380,
      r0: 16,
      x1: 320,
      y1: 380,
      r1: 0,
      shadowBlur: 10,
    },
    {
      x0: 100,
      y0: 420,
      r0: 26,
      x1: 100,
      y1: 420,
      r1: 0,
      shadowBlur: 10,
    },
    {
      x0: 250,
      y0: 450,
      r0: 46,
      x1: 250,
      y1: 450,
      r1: 0,
      shadowBlur: 10,
    },
    {
      x0: 270,
      y0: 430,
      r0: 18,
      x1: 270,
      y1: 430,
      r1: 0,
      shadowBlur: 10,
    },
  ],
  lines: 5, //全屏幕高度可以完整渲染多少行格子
  lineHeight: undefined, //一行高度
  level: [{
    from: 0,
    to: 1,
    block: 4, // 备选块数
    target: 1, //需要点击的块数
    speed: 550 //多少时间滚动完一行 
  }, {
    from: 2,
    to: 5,
    block: 4,
    target: 1,
    speed: 500
  }, {
    from: 6,
    to: 15,
    block: 4,
    target: 2,
    speed: 450
  }, {
    from: 16,
    to: 30,
    block: 4,
    target: 2,
    speed: 400
  }, {
    from: 31,
    to: 50,
    block: 4,
    target: 2,
    speed: 360
  }, {
    from: 51,
    to: 80,
    block: 4,
    target: 2,
    speed: 320
  }, {
    from: 81,
    to: 200,
    block: 4,
    target: 3,
    speed: 300
  }, {
    from: 201,
    to: 300,
    block: 4,
    target: 3,
    speed: 280
  }, {
    from: 301,
    block: 4,
    target: 3,
    speed: 250
  }]
}

if (config.clock) {
  // lg.trace("设置了时钟:" + config.clock);
  _requestAnimationFrame = function (fn) {
    setTimeout(fn, config.clock)
  }
}

var STATE = {
  PAUSED: 1,
  ING: 2,
  END: 3
}
var data = {
  state: STATE.PAUSED, //当前状态
  score: 0, //分数
  lastTick: undefined, // 上次帧发生时刻
  blocksInView: [], // 所有仍在屏幕中的块信息
  lineCount: 0, // 已经生成的行数
  walkBlock: function (handler) {
    this
      .blocksInView
      .forEach((line) => {
        line.forEach((blk) => {
          handler && handler(blk)
        })
      })
  }

}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
}

function getRandomIntN(min, max, count) {
  if (count === 1) {
    return [getRandomInt(min, max)];
  } else if (count > 1) {
    let result = [];
    let indexs = []; //索引数组
    for (let i = min; i < max; i++) {
      indexs.push(i);
    }
    while (result.length < count) {
      let next = getRandomInt(0, indexs.length);
      result.push(indexs[next])
    }
    return result;

  } else {
    return [];
  }
}

var canvasObject = document.getElementById('root');
// var ctx = canvasObject.getContext('2d');
var ctx = canvasObject.getContext('2d', {
  alpha: false
});

/**
 * 定义一个矩形块。这个对象只用于在内存中表示游戏数据
 * @param {*} x 
 * @param {*} y 
 * @param {*} w 
 * @param {*} h 
 * @param {Boolean} isBlack 
 * @param {Number} lineNum 
 */
function Block(x, y, w, h, isBlack, lineNum) {
  this.lineNum = lineNum;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.isBlack = isBlack;
  this.knocked = false; //是否在游戏中已经被敲中
}
/**
 * 方块当前是否包含点击的触点
 */
Block.prototype.containPoint = function (x, y) {
  if (this.x <= x && (this.x + this.w) >= x && this.y <= y && (this.y + this.h) >= y) {
    return true;
  } else {
    return false;
  }
}

/**
 * 尝试点击方块，返回是否处理标记
 */
Block.prototype.tryKnock = function (x, y) {

  // console.log(`knock:[${x},${y},this:[${this.x},${this.y},${this.w},${this.h}]`)
  let contain = this.containPoint(x, y);
  if (contain) {
    this.knocked = true;
    //只有黑色可点
    if (!this.isBlack) {
      //如果点了白色，直接结束
      end();
      return undefined;
    } else {
      data.score++;
      //第一行的方块被点击的时候，可以直接开始
      if (this.lineNum === 0 && data.state !== STATE.ING) {
        start();
      }
    }
  }
  return contain;

}
/**
 * 根据自身属性产生渐变样式
 */
Block.prototype.getFillStyle = function (ctx) {
  var blk = this;
  var gradient;

  //如果是黑块
  if (blk.isBlack) {
    //黑块的渐变需要以自身位置为中心
    gradient = ctx.createLinearGradient(blk.w / 2, blk.y, blk.w / 2, blk.y + blk.h);
    //点中和没点中的不一样
    if (blk.knocked) {
      gradient.addColorStop(0, "#7071D2");
      gradient.addColorStop(1, "#8363BE");
      ctx.fillStyle = gradient;
    } else {
      gradient.addColorStop(0, "#0D3E5C");
      gradient.addColorStop(1, "#050C17");
      ctx.fillStyle = gradient;
    }
  } else {
    //白块的渐变以整个canvas为中心
    gradient = ctx.createLinearGradient(0, 0, 0, config.canvas.height);
    //白块 点中和没点中的不一样
    if (blk.knocked) {
      ctx.fillStyle = '#FF4136';
      // ctx.fillStyle = gradient;
    } else {
      gradient.addColorStop(0, "#6E85F9");
      gradient.addColorStop(1, "#AB76E4");
      ctx.fillStyle = gradient;
    }
  }
}
Block.prototype.getFillStyleOld = function (ctx) {
  var blk = this;
  //如果是黑块
  if (blk.isBlack) {
    //点中和没点中的不一样
    if (blk.knocked) {
      ctx.fillStyle = '#AAA';
    } else {
      ctx.fillStyle = '#000';
    }
  } else {
    //白块 点中和没点中的不一样
    if (blk.knocked) {
      ctx.fillStyle = '#FF4136';
    } else {
      ctx.fillStyle = '#fff';
    }
  }
}
Block.prototype.moveDown = function (y) {
  // lg.trace('movedown=' + y)
  // TODO:这里需要修改，Y不一定要增加，如果高度没达到设定高度，应该增加高度。另外需要看下逻辑，高度是不是可以正常到0
  this.y += y;
  // //检测是否超出底部，是的话修改自身的高度 if (this.y + this.h > config.canvas.height) {   this.h
  // = config.canvas.height - this.y }
}
Block.prototype.visibleRect = function () {
  let r = {
    x: this.x,
    y: this.y,
    w: this.w,
    h: this.h
  };
  //如果完全不可见，则完全不需要绘制
  if (this.y <= 0 - config.lineHeight || this.y >= config.canvas.height) {
    return undefined;
  } else {
    if (this.y < 0) {
      r.y = 0;
      r.h = this.h + this.y;
    } else {
      r.h = Math.min(config.canvas.height - this.y, this.h);
    }
    return r;
  }
}

/**
 * 获取指定canvas位置的像素颜色
 * @param {*} ctx 
 * @param {*} x 
 * @param {*} y 
 */
function getPosColor(ctx, x, y) {
  var pixel = ctx.getImageData(x, y, 1, 1);
  var data = pixel.data;
  var rgba = 'rgba(' + data[0] + ',' + data[1] +
    ',' + data[2] + ',' + (data[3] / 255) + ')';
  return rgba;
}
/**
 * 部分HDPI(DPR>1)的机器上，canvas绘制图片会模糊，因为DPR的原因，这个函数可以把画布的绘制大小放大，展示的时候通过style缩放回去
 * @param {HTMLCanvasElement} canvas 
 */
function setupHDPICanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  //修改配置
  config.canvas.useDpr = dpr;
  config.canvas.width = canvas.width;
  config.canvas.height = canvas.height;

  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
}

//初始化画布，初始block
function init() {
  var docEleRect = window
    .document
    .documentElement
    .getBoundingClientRect();
  config.canvas.width = docEleRect.width;
  config.canvas.height = docEleRect.height;

  canvasObject.setAttribute('width', config.canvas.width);
  canvasObject.setAttribute('height', config.canvas.height);

  //将画布设置为高清模式
  setupHDPICanvas(canvasObject);

  canvasObject.addEventListener('touchstart', handleClick, false);

  config.lineHeight = Math.floor(config.canvas.height / config.lines);

  onUpdate(data, 0); //帧数0. update函数初始化整个块区域，但是不进行移动
  onPaint(ctx, data); //绘制出初始状态
}

function start() {
  // lg.trace('start');
  data.state = STATE.ING;
  _requestAnimationFrame(onFrame);
}

function handleClick(e) {
  // console.log(e);

  if (data.state !== STATE.END) {

    let {
      clientX,
      clientY
    } = e.touches[0];
    clientX = config.canvas.useDpr * clientX;
    clientY = config.canvas.useDpr * clientY;
    data.walkBlock((blk) => {
      blk.tryKnock(clientX, clientY);
    })
  }
}

function pause() {
  data.state = STATE.PAUSED;
}

function resume() {
  data.state = STATE.ING;
}

function end() {
  data.state = STATE.END;

  setTimeout(() => {
    alert(`游戏结束，得分:${data.score}`);
  }, 22)
}
/**
 * 处理一帧
 */
function onFrame(timestamp) {

  // lg.trace('onFrame');
  onUpdate(data, 1);
  onPaint(ctx, data);

  if (data.state === STATE.ING) {
    _requestAnimationFrame(onFrame);
  }
}

/**
 * 更新游戏状态对象
 * @param {Object} state
 */
function onUpdate(state, ticks) {

  // 负责新增一行需要绘制的方块元数据
  function _appendLine(preTop) {
    // 获取当前生成行的难度配置 let levelConfig = config   .level   .filter((l) => {     return
    // (state.lineCount >= (l.from == undefined       ? 0       : l.from)) &&
    // (state.lineCount <= (l.to == undefined       ? Infinity       : l.to)) })[0];

    let levelConfig = config.getLevelConfig(state.lineCount);
    //按照当前行的绘制数量、决定每一个块的宽度
    let blockWidth = Math.floor(config.canvas.width / levelConfig.block);
    let startX = 0;
    let startY = preTop - config.lineHeight;

    let line = [];
    let blackIds = getRandomIntN(0, levelConfig.block, levelConfig.target);
    // console.log('blackIds:') console.log(blackIds)
    for (let i = 0; i < levelConfig.block; i++) {
      let isBlack = blackIds.filter((id) => {
        return id == i
      }).length > 0
      // console.log(`i:${i}.isBlack:${isBlack}`)
      let blk = new Block(startX, startY, blockWidth, config.lineHeight, isBlack, state.lineCount);
      line.push(blk);
      startX += blockWidth;
    }

    state.lineCount++;

    return line;
  }

  function _checkBottomLineAndRemove(bottomLine) {
    //如果最后一行即将超出可视范围
    if (bottomLine[0].y >= config.canvas.height) {
      // 先检查该行的黑块是否全部正常消除
      let exits = bottomLine.filter((blk) => {
        return blk.isBlack && !blk.knocked
      }).length;
      if (exits) {
        end();
      } else {
        data
          .blocksInView
          .splice(0, 1);
        _appendLine(0); //新增一行，这时候最上面一行一定是顶在顶部的，所以直接传0
      }
    }
  }

  //初始化的时候，需要保证内存里有比显示需要多1行
  let needLines = config.lines + 1;

  while (data.blocksInView.length < needLines) {
    let preTop = config.canvas.height;
    if (data.blocksInView.length > 0) {
      preTop = data.blocksInView[data.blocksInView.length - 1][0].y;
    }
    let newLine = _appendLine(preTop);
    data
      .blocksInView
      .push(newLine);
  }
  bottomLine = data.blocksInView[0]; //获取当前最下面一行
  let levelConfig = config.getLevelConfig(bottomLine[0].lineNum);

  //每一个tick,都将所有方块向下移动
  for (let m = 0; m < ticks; m++) {
    data
      .blocksInView
      .forEach((l) => {
        l.forEach((b) => {
          // b.moveDown(Math.floor(levelConfig.speed / 1000 * 16)); //一帧认为是16ms
          // lg.trace('移动block');
          b.moveDown(Math.max(Math.floor(config.lineHeight / levelConfig.speed * 16), 1)); //一帧认为是16ms
        })
      });
    //移动完毕之后，看看是否有行需要移除的。有的话，移除该行，新增一行
    _checkBottomLineAndRemove(bottomLine);
    // if (bottomLine[0].y >= config.canvas.height) {   data     .blocksInView
    // .splice(0, 1);   _appendLine(0); //新增一行，这时候最上面一行一定是顶在顶部的，所以直接传0 }
  }

}

/**
 * 负责根据当前游戏状态，绘制整个游戏区域
 * @param {Canvas} ctx
 * @param {Object} state
 */
function onPaint(ctx, state) {

  // lg.trace('config.canvas.width=' + config.canvas.width);
  // lg.trace('config.canvas.height=' + config.canvas.height);
  ctx.clearRect(0, 0, config.canvas.width, config.canvas.height); // clear canvas

  // 遍历整个可视区域的block二维数组，从下向上进行绘制。需要判断如果超出可视范围之前，则只需要画可视范围内的部分
  state
    .blocksInView
    .forEach((line) => {
      line.forEach((blk) => {
        // console.log(blk);
        let r = blk.visibleRect();
        // console.log(r);
        if (r) {
          blk.getFillStyle(ctx);
          ctx.fillRect(r.x, r.y, r.w, r.h);
          //如果这个块是黑色且在第一行，则画开始按钮
          if (blk.isBlack && blk.lineNum == 0 && !blk.knocked) {
            ctx.drawImage(resources.start, r.x + (r.w - 55 * config.canvas.useDpr) / 2, r.y + (r.h - 27 * config.canvas.useDpr) / 2, 55 * config.canvas.useDpr, 27 * config.canvas.useDpr);
          }
        }
      })
    });

  //画点缀的渐变圆
  if (config.addGradients) {

    config.gradients.forEach((circle) => {
      var gradient = ctx.createRadialGradient(circle.x0 * config.canvas.useDpr, circle.y0 * config.canvas.useDpr, circle.r0 * config.canvas.useDpr, circle.x1 * config.canvas.useDpr, circle.y1 * config.canvas.useDpr, circle.r1 * config.canvas.useDpr);
      var targetColor = getPosColor(ctx, circle.x0 * config.canvas.useDpr, circle.y0 * config.canvas.useDpr);
      gradient.addColorStop(0, targetColor);
      gradient.addColorStop(1, "#efe");
      ctx.fillStyle = gradient;
      ctx.shadowColor = circle.shadowBlur * config.canvas.useDpr;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(circle.x0 * config.canvas.useDpr, circle.y0 * config.canvas.useDpr, circle.r0 * config.canvas.useDpr, 0, 2 * Math.PI);
      ctx.fill();
      // ctx.fillRect((circle.x0 - circle.r0) * config.canvas.useDpr, (circle.y0 - circle.r0) * config.canvas.useDpr, circle.r0 * 2 * config.canvas.useDpr, circle.r0 * 2 * config.canvas.useDpr);
    })
  }

  //画纵向分割线

  ctx.beginPath();
  ctx.strokeStyle = '#FFFFFD';
  ctx.lineWidth = 1 * config.canvas.useDpr;
  ctx.moveTo(config.canvas.width / 4, 0);
  ctx.lineTo(config.canvas.width / 4, config.canvas.height);

  ctx.moveTo(config.canvas.width / 2, 0);
  ctx.lineTo(config.canvas.width / 2, config.canvas.height);

  ctx.moveTo(config.canvas.width / 4 * 3, 0);
  ctx.lineTo(config.canvas.width / 4 * 3, config.canvas.height);


  ctx.stroke();

  //画分数-背景
  // var scoreGradient = ctx.createLinearGradient(config.canvas.width / 4, 0, config.canvas.width / 4 * 3, 0);
  // scoreGradient.addColorStop(0, '#6E85F9');
  // scoreGradient.addColorStop(0.5, '#301B72');
  // scoreGradient.addColorStop(1, '#6E85F9');
  // ctx.fillStyle = scoreGradient;
  // ctx.fillRect(config.canvas.width / 4, 10, config.canvas.width / 2, 36);
  ctx.drawImage(resources.score, config.canvas.width / 4, 10 * config.canvas.useDpr, config.canvas.width / 2, 33 * config.canvas.useDpr);

  //画分数-分数
  ctx.fillStyle = "#FAD35F";
  ctx.font = `bold ${22*config.canvas.useDpr}px serif`;
  ctx.textAlign = "center";
  // ctx.fillText(data.score, config.canvas.width / 2, (10 + 33 / 2) * config.canvas.useDpr);
  ctx.fillText(data.score, config.canvas.width / 2, (10 + 33 - (33 - 22) / 2) * config.canvas.useDpr - 5);

}

//开始初始化
loadRes(() => {
  init();
})


// start();