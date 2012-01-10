(function( window ){

var document = window.document;
var isTouch = 'createTouch' in document;
var cursorStartEvent = isTouch ? 'touchstart' : 'mousedown';
var cursorMoveEvent = isTouch ? 'touchmove' : 'mousemove';
var cursorEndEvent = isTouch ? 'touchend' : 'mouseup';

var defaults = {
  clones: 1,
  decay: 0.03,
  frameInterval: 17,
  maxContactPoints: 3
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
  this.contentWidth = this.content.offsetWidth;
  
  console.log( this)
  
  // keep track of mouse moves, mouse touches, etc
  this.contactPoints = [];
  // this.cloneContents();
  
}

// -------------------------- methods -------------------------- //

Inflickity.prototype.setPosition = function( x, y ) {

  this.x = x % this.contentWidth;
  this.y = y;

  var sign = this.x > 0 ? -1 : 1;

  var cloneX = this.x + this.contentWidth * sign;

  this.content.style.webkitTransform = 'translate3d(' + this.x +'px, 0, 0 )';
  this.contentClone.style.webkitTransform = 'translate3d(' + cloneX +'px, 0px, 0 )';

};

Inflickity.prototype.pushContactPoint = function( cursor, timeStamp ) {

  var contactPoints = this.contactPoints;

  // remove oldest one if array has 3 items
  if ( this.contactPoints.length > this.options.maxContactPoints - 1 )  {
    this.contactPoints.shift();
  }

  this.contactPoints.push({
    x: cursor.pageX,
    y: cursor.pageY,
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
  var avgX = ( lastContactPoint.x - firstContactPoint.x ) / len;

  this.velocityX = ( this.options.frameInterval / avgTime ) * avgX;

  this.animationInterval = setInterval( function( _this ) {
    _this.tick();
  }, this.options.frameInterval, this )

};

Inflickity.prototype.tick = function() {
  // console.log('tick')
  this.setPosition( this.x + this.velocityX );
  // decay velocity
  this.velocityX *= 1 - this.options.decay;

  // if velocity is pretty darn slow, stop it
  if ( Math.abs( this.velocityX ) < 0.5 ) {
    this.resetInterval();
  }

};

Inflickity.prototype.resetInterval = function() {
  if ( this.animationInterval ) {
    clearInterval( this.animationInterval );
  }
};

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
    x: this.x - cursor.pageX,
    y: this.y - cursor.pageY
  };

  window.addEventListener( cursorMoveEvent, this, false );
  window.addEventListener( cursorEndEvent, this, false );

  this.resetInterval();
  this.pushContactPoint( cursor, event.timeStamp );

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
  var x = this.originPoint.x + cursor.pageX;
  this.setPosition( x, 0 );

  // console.log( event.type + ' ' + cursor.pageX )
  this.pushContactPoint( cursor, event.timeStamp );
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

  this.pushContactPoint( cursor, event.timeStamp );
  this.release();

  // reset contact points
  this.contactPoints = [];
  // reset cursor identifier
  delete this.cursorIdentifier;

};

window.Inflickity = Inflickity;

})( window, undefined );
