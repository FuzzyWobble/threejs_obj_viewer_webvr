



//written by fuzzy wobble



/*
	this code has six parts:
	0. init
	1. setup environment
	2. animate/render
	3. ui/gui/controllers
	4. obj loader
	5. other junk
*/





var IS_WEBVR = true; //if you are just testing dev in chrome (non webvr) set this to false







//===========================================================================
//###############################  0. init  #################################
//===========================================================================

//typical threejs vars
var container, camera, scene, renderer, controls, grid, stats, gui; 

//webvr vars
var controller_vr;
var intersectedObjects = [];
var intersected = [];
var tempMatrix;
var uiObject;
var gamepadHelper;
var laserLine;
var laserMarker;
var raycaster;
var guiInputHelper;
var invisibile_object;

//our objs
var our_objs = [];
our_objs.push( {uid:"se02", name:"selma", file:"selma_mtl", x:0,y:0,z:-4, rx:0,ry:2.75,rz:0, oscale:0.35} );
//name/file represent the location where the obj/mtl is stored (obj/name/file.obj & obj/name/file.mtl)
//x,y,z is the starting position
//rx,ry,rz is the starting rotation (many models online have arbitrary inital rotations)
//scale is the starting scale (most models online have arbitrary scales)

//sound
var slow_jazz_mp3 = new Howl({
  src: ['mp3/luxury.mp3'],
  volume: 0.75,
  loop: true
});

//our camera matrix. 
//this is not working right now :(
//move the camera to any position and hit [c] key to get this matix. paste here:
var camera_state_init = "[0.14188073420398306,-2.7755575615628914e-17,0.9898837594696352,0,0.2081715910061202,0.9776371102998909,-0.029837380288150472,0,-0.9677470981406864,0.21029902654191981,0.13870787099440884,0,-9.465153032030017,4.925814783186549,1.9115839464991184,1]";

//my vars
var model_is_loading = true; //turns false after model loaded
var active_obj; //stores the current obj
var active_obj_index = 0; //stores the active index

//our init function
function init(){

	//setup the environment
	setup_environment();

	//init our gui
	init_gui();

	//render
	render();

}

//our page is ready
$(document).ready(function(){

	//load our object load_obj(uid, name, file, x,y,z, rx,ry,rz, scale)
	var o = our_objs[0]; //just load our first obj
	load_obj(o.uid, o.name, o.file, o.x,o.y,o.z, o.rx,o.ry,o.rz, o.oscale);

});








//===========================================================================
//########################  1. setup environment  ###########################
//===========================================================================
function setup_environment(){


	//====================================================================
	//DIV
	container = document.getElementById( 'canvas_fuzzy_wobble' );


	//====================================================================
	//CAMERA
	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
	if(IS_WEBVR===false){
		camera.position.set( 0, 3, 4 );
	}
	


	//====================================================================
	//RENDERER
	renderer = new THREE.WebGLRenderer( {canvas: container, antialias: true} );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0xffffff );
	renderer.shadowIntensity = 0.05;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;


	//====================================================================
	//RENDERER-VR
	if(IS_WEBVR){
		renderer.vr.enabled = true;
		renderer.vr.standing = true; //is this deprecated? 
	}


	//====================================================================
	//VR BUTTON
	if(IS_WEBVR){
		WEBVR.checkAvailability().catch( function( message ){
			console.log("checkAvailability");
			document.body.appendChild( WEBVR.getMessageContainer( message ));
		});
		WEBVR.getVRDisplay( function( display ){
			console.log("getVRDisplay");
			renderer.vr.setDevice( display );
			document.body.appendChild( WEBVR.getButton( display, container ));
		});
	}


	//====================================================================
	//SCENE
	scene = new THREE.Scene();


	//====================================================================
	//STATS
	stats = new Stats();
	document.body.appendChild( stats.dom );


	//====================================================================
	//GUI
	if(IS_WEBVR){
		dat.GUIVR.enableMouse( camera );
		var guivr = dat.GUIVR.create( 'scale' );
		guivr.position.set( 0.1, 1.5, -1 );
		guivr.rotation.set( Math.PI / -6, 0, 0 );
		scene.add( guivr );
		castShadows( guivr );
		var guivr_model_param  = { 
			scale:1.0 
		};
		guivr.add( guivr_model_param, 'scale', 0.10, 10 ).step( 0.1 ).name( 'Scale' ).onChange(function(val){
			var original_scale = our_objs[active_obj_index].oscale;
			active_obj.scale.set( val*original_scale, val*original_scale, val*original_scale );
		});
	}else{
		gui = new dat.GUI();
		var gui_model = gui.addFolder( 'model' ); 
		var gui_model_param = {
			x:0,y:0,z:-4,rx:0,ry:2.75,rz:0,scale:1.0
		};
		gui_model.add( gui_model_param, 'x',-10,10 ).step(0.1).onChange(function(val){  
			active_obj.position.x = val;
		});
		gui_model.add( gui_model_param, 'y',-10,10 ).step(0.1).onChange(function(val){  
			active_obj.position.y = val;
		});
		gui_model.add( gui_model_param, 'z',-10,10 ).step(0.1).onChange(function(val){  
			active_obj.position.z = val;
		});
		gui_model.add( gui_model_param, 'rx',0,Math.PI*2 ).step(0.01).onChange(function(val){  
			active_obj.rotation.x = val;
		});
		gui_model.add( gui_model_param, 'ry',0,Math.PI*2 ).step(0.01).onChange(function(val){  
			active_obj.rotation.y = val;
		});
		gui_model.add( gui_model_param, 'rz',0,Math.PI*2 ).step(0.01).onChange(function(val){  
			active_obj.rotation.z = val;
		});
		gui_model.add( gui_model_param, 'scale',0.10,10 ).step(0.1).onChange(function(val){  
			var original_scale = our_objs[active_obj_index].oscale;
			active_obj.scale.set( val*original_scale, val*original_scale, val*original_scale );
		});
		gui_model.close();		
	}


	//====================================================================
	//GRID HELPTER
	grid = new THREE.GridHelper( 200, 200, 0xaaaaaa, 0xaaaaaa );
	grid.position.set( 0, 0, 0 );
	grid.receiveShadow = false; //this don't do shit
	scene.add( grid );


	//====================================================================
	//FOG
	scene.fog = new THREE.FogExp2( 0xffffff, 0.03);


	//====================================================================
	//LIGHTS
	var light1 = new THREE.AmbientLight( 0x404040, 0.25 ); 
	scene.add( light1 );
	var light2 = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.85);
	light2.position.set(0, 5, 0);
	scene.add( light2 );


	//====================================================================
	//TEXTURE FLOOR
	// var loader = new THREE.TextureLoader();
	// var floorTexture = loader.load('texture/grass1.jpg');
	// floorTexture.wrapS = THREE.RepeatWrapping;
	// floorTexture.wrapT = THREE.RepeatWrapping;
	// floorTexture.repeat.set(160, 160);
	// var planeGeometry = new THREE.PlaneGeometry(1000, 1000);
	// var planeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, map: floorTexture });
	// var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	// plane.receiveShadow = true;
	// plane.castShadow = true;
	// plane.rotation.x = -0.5 * Math.PI;
	// plane.position.set(0, 0, 0);
	// scene.add(plane);


	//====================================================================
	//SKYBOX
	// var cubeTextureLoader = new THREE.CubeTextureLoader();
	// cubeTextureLoader.setPath( 'js/three_js/examples/textures/cube/skyboxsun25deg/' );
	// var cubeTexture = cubeTextureLoader.load( [
	// 	'px.jpg', 'nx.jpg',
	// 	'py.jpg', 'ny.jpg',
	// 	'pz.jpg', 'nz.jpg',
	// ] );
	// var cubeShader = THREE.ShaderLib[ 'cube' ];
	// cubeShader.uniforms[ 'tCube' ].value = cubeTexture;
	// var skyBoxMaterial = new THREE.ShaderMaterial( {
	// 	fragmentShader: cubeShader.fragmentShader,
	// 	vertexShader: cubeShader.vertexShader,
	// 	uniforms: cubeShader.uniforms,
	// 	side: THREE.BackSide
	// } );
	// var skyBox = new THREE.Mesh( new THREE.BoxBufferGeometry( 1000, 1000, 1000 ), skyBoxMaterial );
	// scene.add( skyBox );


	//====================================================================
	//WEBVR CONTROLLER
	if(IS_WEBVR){
		controller_vr = new THREE.Object3D(); //fake controller, for now.
		tempMatrix = new THREE.Matrix4();
		raycaster = new THREE.Raycaster();
		var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); 
		var material = new THREE.MeshBasicMaterial();
		uiObject = new THREE.Mesh(geometry, material);
		uiObject.position.z = -5;	
		intersectedObjects = [uiObject];
	}else{
		controls = new THREE.OrbitControls( camera, container );
		controls.target.set( 0, 0, -3 ); //look at horizon
		controls.keys = {}; //disable control arrow keys
		controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		controls.dampingFactor = 0.25;
	}



	//====================================================================
	//ADD OUR MODEL TO THE SCENE
	scene.add( active_obj ); 

}












//===========================================================================
//#########################  2. animate/render  #############################
//===========================================================================
var loop_counter = 0;
function render(){

	loop_counter++;

	animate();

	requestAnimationFrame( render ); //jumps to next frame when the renderer is ready, tries for 60fps

	if(model_is_loading===true){
		//do nothing
	}else{
		renderer.render( scene, camera );
	}

	if(IS_WEBVR===false){
		controls.update();
	}else{
		THREE.VRController.update();
	}
	
	stats.update(); //update our stats/performance

}
function animate(){

	if(model_is_loading===true){
		//do nothing
	}else{
		//let's just slowly rotate our obj
		//active_obj.rotation.y += 0.005;
	}

}












//===========================================================================
//#######################  3. ui/gui/vrontroller  ###########################
//===========================================================================
function init_gui(){

	window.addEventListener( 'vr controller connected', function( event ){

		console.log("controller connected", event);

		initController(event);
		castShadows(controller_vr);
		receiveShadows(controller_vr);

		controller_vr.addEventListener('primary press began', onControllerPress);
		controller_vr.addEventListener('primary press ended', onControllerPressEnd);
		controller_vr.addEventListener('thumbstick axes changed', onThumbstick);
		controller_vr.addEventListener('disconnected', onControllerDisconnect);

	});

}
function onThumbstick(event){

	// oculus
	//              Top: Y = +1
	//                   ↑
	//    Left: X = -1 ←─┼─→ Right: X = +1
	//                   ↓
	//           Bottom: Y = -1

	console.log(event);

	active_obj.position.x -= event.axes[0]/75;
	active_obj.position.z -= event.axes[1]/75;
	grid.position.x -= event.axes[0]/75;
	grid.position.z -= event.axes[1]/75;

}

function onControllerDisconnect(event) {

	controller_vr.parent.remove(controller_vr);

}
function onControllerPress(event) {

	console.log("PRESS");

	guiInputHelper.pressed( true );

	if(controller_vr.userData.selected !== undefined){
		var object = controller_vr.userData.selected;
		object.material.color.setHex(0xff0000);
	}else{
		console.log("SHOW MENU");
	}
	

}
function onControllerPressEnd(event) {

	console.log("PRESSEND");

	guiInputHelper.pressed( false );

	if(controller_vr.userData.selected !== undefined){
		var object = controller_vr.userData.selected;
		object.material.color.setHex(controller_vr.userData.currentHex);
		controller_vr.userData.selected = undefined;
	}

}
function initController(event) {

	controller_vr = event.detail;
	controller_vr.name = "vr_controller";
	scene.add(controller_vr);

	controller_vr.standingMatrix = renderer.vr.getStandingMatrix();
	controller_vr.head = window.camera; //?

	console.log("~ controller ~");
	console.log(controller_vr);

	addControllerModel();
	createLaserLine();
	createMarker();

}
function addControllerModel() {

	var meshColorOff = 0xDB3236;
	var meshColorOn = 0xF4C20D;
	var controllerMaterial = new THREE.MeshStandardMaterial({color: meshColorOff});
	var controllerMesh = new THREE.Mesh(
		new THREE.CylinderGeometry(0.005, 0.05, 0.1, 6),
		controllerMaterial
	);
	var handleMesh = new THREE.Mesh(
	   new THREE.BoxGeometry(0.03, 0.1, 0.03),
	   controllerMaterial
	);
	controllerMaterial.flatShading = true;
	controllerMesh.rotation.x = -Math.PI / 2;
	handleMesh.position.y = -0.05;
	controllerMesh.add(handleMesh);

	guiInputHelper = dat.GUIVR.addInputObject( controller_vr );
	scene.add( guiInputHelper );
	
	controller_vr.userData.mesh = controllerMesh;
	controller_vr.add(controllerMesh);

}

function createLaserLine() {

	var lineMaterial =  new THREE.LineBasicMaterial( { linewidth: 4 } ); //line width don't work in Chrome?
	laserLine = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
	laserLine.geometry.addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -10], 3));
	laserLine.name = 'line';
	controller_vr.add(laserLine);

}

function createMarker(){

	var geometry = new THREE.CircleBufferGeometry(1, 32);
	var material = new THREE.MeshBasicMaterial({color: 0xffffff});
	laserMarker = new THREE.Mesh(geometry, material);
	laserMarker.name = "marker";
	laserMarker.scale.set(0.1, 0.1, 0.1);
	laserMarker.position.z = -10;
	//setDepthAndScale(-10, mesh, camera);
	laserLine.add(laserMarker);
	///controller.add(laserMarker);
}
applyDown = function(obj, key, value) {
	obj[key] = value;
	if (obj.children !== undefined && obj.children.length > 0) {
		obj.children.forEach(function(child) {
			applyDown(child, key, value);
		});
	}
};
castShadows = function(obj) { applyDown(obj, 'castShadow', true); };
receiveShadows = function(obj) { applyDown(obj, 'receiveShadow', true); };



//interact with page
$(document).ready(function(){ //our page is ready


	//___________________________________________________
	//click okay on intro screen
	$(".launch_web").click(function(){
		IS_WEBVR = false;
		init();
		$(".instructions_whiteout").fadeOut(500);
		slow_jazz_mp3.play();
	});
	$(".launch_webvr").click(function(){
		IS_WEBVR = true;
		init();
		$(".instructions_whiteout").fadeOut(500);
		slow_jazz_mp3.play();
	});


	//___________________________________________________
	//key pressed
	$(document).keydown(function(event){
    	var keyCode = (event.keyCode ? event.keyCode : event.which);
    	console.log(keyCode);
		if(keyCode === 67){
			console.log( JSON.stringify(camera.matrix.toArray()) );
			alert( JSON.stringify(camera.matrix.toArray()) );
		}
	});


	//___________________________________________________
	//arrow keys
	$(document).keydown(function(e){
		switch(e.keyCode){
			case 38: //up arrow
				active_obj.position.x -= 0.25;
				grid.position.x -= 0.25;
			break;
			case 37: //left arrow
				active_obj.position.z += 0.25;
				grid.position.z += 0.25;
			break;
			case 39: //right arrow
				active_obj.position.z -= 0.25;
				grid.position.z -= 0.25;
			break;
			case 40: //down arrow
				active_obj.position.x += 0.25;
				grid.position.x += 0.25;
			break;
		}
	});

	

});















//===========================================================================
//###########################  4. obj loader  ###############################
//===========================================================================
function load_obj(uid, name, file, x,y,z, rx,ry,rz, scale){

	model_is_loading = true;

	new THREE.MTLLoader().load( 'obj/'+name+'/'+file+'.mtl', function ( materials ) {

		materials.baseUrl = 'obj/'+name+'/';

		materials.preload();

		new THREE.OBJLoader().setMaterials( materials ).load( 'obj/'+name+'/'+file+'.obj', function ( object ) {

			console.log(object); //look at the object in console and ur head will explode.

			object.scale.set( scale,scale,scale );

			object.rotation.set( rx,ry,rz );

			object.position.set( x,y,z );

			if(active_obj!==undefined){
				scene.remove( active_obj ); //remove the existing obj from the scene
			}

			//scene.add( object ); //add obj to our scene

			//lets set our active object to the loaded object
			active_obj = object;

			//lets set the shininess
			object.traverse(function(child){
				if(child instanceof THREE.Mesh){ 
					child.material.shininess = 33;
				}
			});

			model_is_loading = false;

		}, onProgressOBJ, onErrorOBJ );

	} );
	
}
var onProgressOBJ = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

		loading_bar_w = (xhr.loaded/xhr.total)*100; //final bar width is 100
		$(".loading_bar").css("width",loading_bar_w+"px");

		//we only need to do this on the very first load
		if((xhr.loaded/xhr.total) >= 1.0){
			$(".loading_whiteout").fadeOut(500);
		}

	}

};
var onErrorOBJ = function ( xhr ) { 
	console.log("OBJ LOADING ERROR");
	console.log(xhr);
};






















//===========================================================================
//###########################  5. other junk  ###############################
//===========================================================================
$(window).resize(function(){
	responsive_ui();
});
$(document).ready(function(){
	responsive_ui();
});
$(window).load(function(){
	responsive_ui();
});
function responsive_ui(){
	$(".centerxy").each(function(){ $(this).center(1,1); });
	$(".centerx").each(function(){ $(this).center(1,0); });
	$(".centery").each(function(){ $(this).center(0,1); });
}
$.fn.center = function(x,y){
	if(x==1){this.css("left", Math.max(0, (($(this).parent().width() - $(this).outerWidth()) / 2) ) + "px");}
	if(y==1){this.css("top", Math.max(0, (($(this).parent().height() - $(this).outerHeight()) / 2) ) + "px");}
	return this;
};
$.fn.center2 = function(x,y){
	if(x==1){this.css("left", (($(this).parent().width() - $(this).outerWidth()) / 2)  + "px");}
	if(y==1){this.css("top", (($(this).parent().height() - $(this).outerHeight()) / 2)  + "px");}
	return this;
};
//responsive
window.onload = function(){
	this.addEventListener( 'resize', onWindowResize_VR, false );
};
function onWindowResize_VR(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}














