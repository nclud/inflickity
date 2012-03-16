(function( window ){

var document = window.document;
var isTouch = 'createTouch' in document;
var cursorStartEvent = isTouch ? 'touchstart' : 'mousedown';
var cursorMoveEvent = isTouch ? 'touchmove' : 'mousemove';
var cursorEndEvent = isTouch ? 'touchend' : 'mouseup';
var Modernizr = window.Modernizr;
var transformProp = Modernizr.prefixed('transform');

function getNow() {
  return ( new Date() ).getTime();
}

// hello
function Inflickity( elem, options ) {
  
  this.element = elem;
  this.content = elem.children[0];

  // clone content so there is no gaps
  this.contentClone = this.content.cloneNode(true);
  if ( this.content.id ) {
    this.contentClone.id = this.content.id + '-inflickity-clone';
  }
  this.contentClone.className += ' inflickity-clone'
  this.element.appendChild( this.contentClone );
  
  // set options
  this.options = {};
  for ( var prop in Inflickity.defaults ) {
    this.options[ prop ] = options && options.hasOwnProperty( prop ) ?
      options[ prop ] : Inflickity.defaults[ prop ];
  }
  
  this.element.addEventListener( cursorStartEvent, this, false );
  
  // this.element.style.position = 'relative';
  this.content.style.position = 'absolute';
  this.contentClone.style.position = 'absolute';

  // flag for triggering clicks
  this.isUnmoved = true;
  
  this.x = 0;
  this.y = 0;
  this.offset = 0;
  this.contentWidth = this.content.offsetWidth;
  if ( this.options.offsetAngle ) {
    this.element.style[ transformProp ] = 'rotate(' +this.options.offsetAngle + 'rad)';
  }
  
  // keep track of mouse moves, mouse touches, etc
  this.contactPoints = [];
  // this.cloneContents();
  
}

Inflickity.defaults = {
  clones: 1,
  friction: 0.03,
  maxContactPoints: 3,
  offsetAngle: 0,
  onClick: undefined,
  animationDuration: 400,
  // basically jQuery swing
  easing: function( progress, n, firstNum, diff ) {
    return ( ( -Math.cos( progress * Math.PI ) / 2 ) + 0.5 ) * diff + firstNum;
  }
};


// -------------------------- methods -------------------------- //

Inflickity.prototype.setOffset = function( offset ) {
  var contentW = this.contentWidth;

  // offset = positive number, between 0 & contentWidth
  this.offset = ( ( offset % contentW ) + contentW ) % contentW;

  this.positionElem( this.content, this.offset, 0 );
  this.positionElem( this.contentClone, this.offset - contentW, 0 );
};

Inflickity.prototype.positionElem = Modernizr.csstransforms3d ? function( elem, x, y ) {
    elem.style[ transformProp ] = 'translate3d( ' + x + 'px, ' + y + 'px, 0)';
  } :
  Modernizr.csstransforms ? function( elem, x, y ) {
    elem.style[ transformProp ] = 'translate( ' + x + 'px, ' + y + 'px)';
  } :
  function( elem, x, y ) {
    elem.style.left = x + 'px';
    elem.style.top = y + 'px';
  };

Inflickity.prototype.pushContactPoint = function( offset ) {

  var contactPoints = this.contactPoints;

  // remove oldest one if array has 3 items
  if ( this.contactPoints.length > this.options.maxContactPoints - 1 )  {
    this.contactPoints.shift();
  }

  this.contactPoints.push({
    'offset': offset,
    timeStamp: getNow()
  });

};

Inflickity.prototype.getCursorOffset = function( cursor ) {
  var dx = cursor.pageX - this.originPoint.x;
  var dy = cursor.pageY - this.originPoint.y;
  // distance of cursor from origin point
  var cursorDistance = Math.sqrt( dx * dx + dy * dy );
  // angle of cursor from origin point
  var cursorAngle = Math.atan2( dy, dx );
  var relativeAngle = Math.abs( cursorAngle - this.options.offsetAngle );
  var offset = cursorDistance * Math.cos( relativeAngle );
  return offset;
}

// -------------------------- event handling -------------------------- //

Inflickity.prototype.handleEvent = function( event ) {

  var handler = 'handle' + event.type;
  if ( this[ handler] ) {
    this[ handler ]( event );
  }

};

Inflickity.prototype.handlemousedown = function( event ) {
  this.cursorStart( event, event )
};

Inflickity.prototype.handletouchstart = function( event ) {
  // disregard additional touches
  if ( this.cursorIdentifier ) {
    return;
  }

  this.cursorStart( event.changedTouches[0], event );
};

Inflickity.prototype.cursorStart = function( cursor, event ) {

  this.cursorIdentifier = cursor.identifier || 1;

  this.originPoint = {
    x: cursor.pageX,
    y: cursor.pageY
  };

  this.offsetOrigin = this.offset;

  window.addEventListener( cursorMoveEvent, this, false );
  window.addEventListener( cursorEndEvent, this, false );

  this.stopAnimation();
  var offset = this.getCursorOffset( cursor );
  this.pushContactPoint( offset );

  // reset isDragging flag
  this.isDragging = false;

  this.wasScrollingBeforeCursorStart = this.velocity && Math.abs( this.velocity ) > 3;

  event.preventDefault();

};


Inflickity.prototype.handlemousemove = function( event ) {
  this.cursorMove( event, event );
};

Inflickity.prototype.handletouchmove = function( event ) {
  var touch;
  for (var i=0, len = event.changedTouches.length; i < len; i++) {
    touch = event.changedTouches[i];
    if ( touch.identifier === this.cursorIdentifier ) {
      this.cursorMove( touch, event );
      break;
    }
  }
};

Inflickity.prototype.cursorMove = function( cursor, event ) {

  var offset = this.getCursorOffset( cursor );

  // var d = this.originPoint.x + cursor.pageX;
  this.setOffset( this.offsetOrigin + offset );

  this.pushContactPoint( offset );

  var movedX = Math.abs( cursor.pageX - this.originPoint.x );
  var movedY = Math.abs( cursor.pageY - this.originPoint.y );

  // cancel click event if moved further than 6x6 pixels
  if ( !this.isDragging && ( movedX > 3 || movedY > 3 ) ) {
    this.isDragging = true;
  }

};

Inflickity.prototype.handlemouseup = function( event ) {
  this.cursorEnd( event, event );
};

Inflickity.prototype.handletouchend = function( event ) {
  var touch;
  for (var i=0, len = event.changedTouches.length; i < len; i++) {
    touch = event.changedTouches[i];
    if ( touch.identifier === this.cursorIdentifier ) {
      this.cursorEnd( touch, event );
      break;
    }
  }

};


Inflickity.prototype.cursorEnd = function( cursor, event ) {

  window.removeEventListener( cursorMoveEvent, this, false );
  window.removeEventListener( cursorEndEvent, this, false );

  var offset = this.getCursorOffset( cursor );
  this.pushContactPoint( offset );
  this.release();

  // reset contact points
  this.contactPoints = [];
  // reset cursor identifier
  delete this.cursorIdentifier;

  // if not dragging, click event fired
  if ( !this.isDragging && !this.wasScrollingBeforeCursorStart && typeof this.options.onClick === 'function' ) {
    this.options.onClick.call( this, event, cursor );
  }

  // not dragging any more
  this.isDragging = false;

};

// -------------------------- animation -------------------------- //

// after cursorEnd event, allow inertial scrolling
Inflickity.prototype.release = function() {

  var contactPoints = this.contactPoints;
  var len = contactPoints.length;
  var lastContactPoint = contactPoints[ len - 1 ];
  var firstContactPoint = contactPoints[0];
  // get average time between first and last contact point
  var avgTime = ( lastContactPoint.timeStamp - firstContactPoint.timeStamp ) / len;
  var avgOffset = ( lastContactPoint.offset - firstContactPoint.offset ) / len;

  this.velocity = ( this.options.animationInterval / avgTime ) * avgOffset;

  this.animate({
    intervalFn: function( _this ) {
      _this.releaseTick();
    }
  });

};

Inflickity.prototype.releaseTick = function() {

  this.setOffset( this.offset + this.velocity );
  // decay velocity
  this.velocity *= 1 - this.options.friction;

  // if velocity is slow enough, stop animation
  if ( Math.abs( this.velocity ) < 0.5 ) {
    this.stopAnimation();
  }

};


Inflickity.prototype.scrollTo = function( dest, duration ) {
  var cw = this.contentWidth;
  dest = ( ( dest % cw ) + cw ) % cw;
  var diff = dest - this.offset;

  // adjust to closet destination
  if ( Math.abs( diff ) > cw / 2 ) {
    var sign = diff > 0 ? -1 : 1;
    diff = diff + cw * sign;
  }

  this.animate({
    duration: duration,
    origin: this.offset,
    diff: diff,
    intervalFn: function( _this ) {
      _this.scrollToTick();
    }
  });
};

Inflickity.prototype.scrollToTick = function() {
  var ani = this.animation;
  var progress = ( getNow() - ani.startTime ) / ani.duration;

  if ( progress >= 1 ) {
    this.stopAnimation();
  }

  var offset = this.options.easing( progress, null, ani.origin, ani.diff )
  this.setOffset( offset );
};

// options should have options.intervalFn,
// which is the function ran each interval, gets `this` as argument
Inflickity.prototype.animate = function( animation ) {
  // stop previous animation
  this.stopAnimation();

  this.isScrolling = true;

  this.animation = animation;
  this.animation.startTime = getNow();
  this.animation.duration = this.animation.duration || this.options.animationDuration;
  // start interval
  this.animation.interval = setInterval( animation.intervalFn, this.options.animationInterval, this );
};

Inflickity.prototype.stopAnimation = function() {
  this.isScrolling = false;
  if ( this.animation && this.animation.interval ) {
    clearInterval( this.animation.interval );
    delete this.animation;
  }
};

window.Inflickity = Inflickity;

})( window, undefined );
