(function( window ){

var defaults = {
  clones: 1,
  decay: 0.07,
  frameInterval: 17
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
  
  console.log( this.options );
  
  this.element.addEventListener( 'mousedown', this, false );
  
  this.element.style.position = 'relative';
  this.content.style.position = 'absolute';
  this.contentClone.style.position = 'absolute';
  
  
  this.x = 0;
  this.y = 0;
  this.contentWidth = this.content.offsetWidth;
  
  console.log( this)
  
  // this.cloneContents();
  
}



Inflickity.prototype.handleEvent = function( event ) {

  var handler = 'handle' + event.type;
  if ( this[ handler] ) {
    this[ handler ]( event );
  }

};

Inflickity.prototype.handlemousedown = function( event ) {

  this.originPoint = {
    x: event.pageX,
    y: event.pageY
  };

  window.addEventListener( 'mousemove', this, false );
  window.addEventListener( 'mouseup', this, false );

  event.preventDefault();

};

Inflickity.prototype.handlemousemove = function( event ) {

  this.deltaX = this.originPoint.x - event.pageX;

  var moveXA = ( this.x - this.deltaX ) % this.contentWidth
  var moveXB = moveXA + this.contentWidth;
  
  this.content.style.webkitTransform = 'translate3d(' + moveXA +'px, 0, 0 )';
  this.contentClone.style.webkitTransform = 'translate3d(' + (moveXB) +'px, 0px, 0 )';

  console.log('mousemove', moveXA )

};

Inflickity.prototype.handlemouseup = function( event ) {
  console.log('mouse up');
  
  this.x -= this.deltaX % this.contentWidth;
  
  window.removeEventListener( 'mousemove', this, false );
  window.removeEventListener( 'mouseup', this, false );

};

window.Inflickity = Inflickity;

})( window, undefined );
