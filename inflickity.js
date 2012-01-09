(function( window ){

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
    this.options[ prop ] = options[ prop ] || defaults[ prop ];
  }
  
  this.element.addEventListener( 'mousedown', this, false );
  
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

Inflickity.prototype.pushContactPoint = function( event ) {

  var contactPoints = this.contactPoints;

  // remove oldest one if array has 3 items
  if ( contactPoints.length > this.options.maxContactPoints - 1 )  {
    contactPoints.shift();
  }

  contactPoints.push( event );

};

Inflickity.prototype.release = function() {

  var contactPoints = this.contactPoints;
  var len = contactPoints.length;
  var lastContactPoint = contactPoints[ len - 1 ];
  var firstContactPoint = contactPoints[0];
  // get average time between first and last contact point
  var avgTime = ( lastContactPoint.timeStamp - firstContactPoint.timeStamp ) / len;
  var avgX = ( lastContactPoint.pageX - firstContactPoint.pageX ) / len;

  this.velocityX = ( this.options.frameInterval / avgTime ) * avgX;

  this.animationInterval = setInterval( function( _this ) {
    _this.tick();
  }, this.options.frameInterval, this )

};

Inflickity.prototype.tick = function() {
  console.log('tick')
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

  this.originPoint = {
    x: this.x - event.pageX,
    y: this.y - event.pageY
  };

  window.addEventListener( 'mousemove', this, false );
  window.addEventListener( 'mouseup', this, false );

  this.resetInterval();
  this.pushContactPoint( event );

  event.preventDefault();

};

Inflickity.prototype.handlemousemove = function( event ) {

  var x = this.originPoint.x + event.pageX;
  this.setPosition( x, 0 );

  this.pushContactPoint( event );

};

Inflickity.prototype.handlemouseup = function( event ) {
  // console.log('mouse up', this.contactPoints );
  
  window.removeEventListener( 'mousemove', this, false );
  window.removeEventListener( 'mouseup', this, false );

  this.pushContactPoint( event );
  this.release();

  // reset contact points
  this.contactPoints = [];

};

window.Inflickity = Inflickity;

})( window, undefined );
