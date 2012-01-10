(function( window ){

var document = window.document;
var isTouch = 'createTouch' in document;
var cursorStartEvent = isTouch ? 'touchstart' : 'mousedown';
var cursorMoveEvent = isTouch ? 'touchmove' : 'mousemove';
var cursorEndEvent = isTouch ? 'touchend' : 'mouseup';
var Modernizr = window.Modernizr;
var transformProp = Modernizr.prefixed('transform');

var defaults = {
  clones: 1,
  decay: 0.03,
  frameInterval: 17,
  maxContactPoints: 3,
  offsetAngle: 0
};

// hello
function Inflickity( elem, options ) {
  
  this.element = elem;
  this.content = elem.children[0];
  
  this.contentClone = this.content.cloneNode(true);
  this.contentClone.id = this.content.id + '-inflickity-clone';
  this.contentClone.className += ' inflickity-clone'
  this.element.appendChild( this.contentClone );
  
  // set options
  this.options = {};
  for ( var prop in defaults ) {
    this.options[ prop ] = options.hasOwnProperty( prop ) ? options[ prop ] : defaults[ prop ];
  }
  
  this.element.addEventListener( cursorStartEvent, this, false );
  
  this.element.style.position = 'relative';
  this.content.style.position = 'absolute';
  this.contentClone.style.position = 'absolute';
  
  
  this.x = 0;
  this.y = 0;
  this.offset = 0;
  this.contentWidth = this.content.offsetWidth;
  if ( this.options.offsetAngle ) {
    this.element.style[ transformProp ] = 'rotate(' +this.options.offsetAngle + 'rad)';
  }
  
  console.log( this)
  
  // keep track of mouse moves, mouse touches, etc
  this.contactPoints = [];
  // this.cloneContents();
  
}

// -------------------------- methods -------------------------- //

Inflickity.prototype.scrollTo = function( offset ) {

  this.offset = offset % this.contentWidth;

  var sign = this.offset > 0 ? -1 : 1;
  var cloneOffset = this.offset + this.contentWidth * sign;

  this.positionElem( this.content, this.offset, 0 );
  this.positionElem( this.contentClone, cloneOffset, 0 );

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

Inflickity.prototype.pushContactPoint = function( offset, timeStamp ) {

  var contactPoints = this.contactPoints;

  // remove oldest one if array has 3 items
  if ( this.contactPoints.length > this.options.maxContactPoints - 1 )  {
    this.contactPoints.shift();
  }

  this.contactPoints.push({
    'offset': offset,
    'timeStamp': timeStamp
  });

};

Inflickity.prototype.release = function() {

  var contactPoints = this.contactPoints;
  var len = contactPoints.length;
  var lastContactPoint = contactPoints[ len - 1 ];
  var firstContactPoint = contactPoints[0];
  // get average time between first and last contact point
  var avgTime = ( lastContactPoint.timeStamp - firstContactPoint.timeStamp ) / len;
  var avgOffset = ( lastContactPoint.offset - firstContactPoint.offset ) / len;

  this.velocity = ( this.options.frameInterval / avgTime ) * avgOffset;

  this.animationInterval = setInterval( function( _this ) {
    _this.tick();
  }, this.options.frameInterval, this )

};

Inflickity.prototype.tick = function() {
  // console.log('tick')
  this.scrollTo( this.offset + this.velocity );
  // decay velocity
  this.velocity *= 1 - this.options.decay;

  // if velocity is pretty darn slow, stop it
  if ( Math.abs( this.velocity ) < 0.5 ) {
    this.resetInterval();
  }

};

Inflickity.prototype.resetInterval = function() {
  if ( this.animationInterval ) {
    clearInterval( this.animationInterval );
  }
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

  var message = '';
  for ( var prop in cursor ) {
    message += ' ' + prop;
  }
  // console.log( message )

  this.cursorIdentifier = cursor.identifier || 1;

  this.originPoint = {
    x: cursor.pageX,
    y: cursor.pageY
  };

  this.offsetOrigin = this.offset;

  window.addEventListener( cursorMoveEvent, this, false );
  window.addEventListener( cursorEndEvent, this, false );

  this.resetInterval();
  var offset = this.getCursorOffset( cursor );
  this.pushContactPoint( offset, event.timeStamp );

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

// Inflickity.prototype.getDistance

Inflickity.prototype.cursorMove = function( cursor, event ) {

  var offset = this.getCursorOffset( cursor );

  // var d = this.originPoint.x + cursor.pageX;
  this.scrollTo( this.offsetOrigin + offset );

  // console.log( event.type + ' ' + cursor.pageX )
  this.pushContactPoint( offset, event.timeStamp );
};

Inflickity.prototype.handlemouseup = function( event ) {
  // console.log('mouse up', this.contactPoints );
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
  this.pushContactPoint( offset, event.timeStamp );
  this.release();

  // reset contact points
  this.contactPoints = [];
  // reset cursor identifier
  delete this.cursorIdentifier;

};

window.Inflickity = Inflickity;

})( window, undefined );
