createLandscape({
    palleteImage:'static/img/palette.png'
})

function createLandscape(params){

    var container = document.querySelector("#c")
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, renderer, camera;
    var terrain, skybox;
    var gyro;

    var mouse = { x:0, y:0, xDamped:0, yDamped:0 };
    var isMobile = typeof window.orientation !== 'undefined'

    init();

    function init(){
        gyro = new GyroNorm(); // gyroscope polyfill

        sceneSetup();
        sceneElements();
        sceneTextures();
        render();

            //window.addEventListener("touchmove", onInputMove, {passive:false})
            //gyro.init().then( () => gn.start( onOrientationChange ) )
        if(isMobile)
            window.addEventListener("deviceorientation", onOrientationChange, true)
        else
            window.addEventListener("mousemove", onInputMove)

        window.addEventListener("resize", resize)
        resize()
    }

    function sceneSetup(){
        scene = new THREE.Scene();
        var fogColor = new THREE.Color( 0x000000 )
        scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 10, 400);


        sky()

        camera = new THREE.PerspectiveCamera(60, width / height, .1, 10000);
        camera.position.y = 8;
        camera.position.z = 4;

        ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight)


        renderer = new THREE.WebGLRenderer( {
            canvas:container,
            antialias:true
        } );
        renderer.setPixelRatio = devicePixelRatio;
        renderer.setSize(width, height);


    }

    function sceneElements(){

        var geometry = new THREE.PlaneBufferGeometry(100, 400, 400, 400);

        var uniforms = {
            time: { type: "f", value: 0.0 },
            distortCenter: { type: "f", value: 0.1 },
            roadWidth: { type: "f", value: 0.5 },
            pallete:{ type: "t", value: null},
            speed: { type: "f", value: 1 },
            maxHeight: { type: "f", value: 10.0 },
            color:new THREE.Color(1, 1, 1),
            scrollPercent: { type: "f", value: 0.0 }
        }

        var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([ THREE.ShaderLib.basic.uniforms, uniforms ]),
            vertexShader: document.getElementById( 'custom-vertex' ).textContent,
            fragmentShader: document.getElementById( 'custom-fragment' ).textContent,
            wireframe:false,
            fog:true
        });

        terrain = new THREE.Mesh(geometry, material);
        terrain.position.z = -180;
        terrain.rotation.x = -Math.PI / 2

        scene.add(terrain)
    }

    function sceneTextures(){
        // pallete
        new THREE.TextureLoader().load( params.palleteImage, function(texture){
            terrain.material.uniforms.pallete.value = texture;
            terrain.material.needsUpdate = true;
        });
    }

    function calculateSunPosition(scrollPos) {
        let lerpedThetaMod = map(scrollPos, 0, 1, -0.03, -0.25);

        var theta = Math.PI * ( lerpedThetaMod ); // -0.03 -> -0.25
        var phi = 2 * Math.PI * ( -.25 );

        let vec = new THREE.Vector3(0,0,0);

        vec.x = 400000 * Math.cos( phi );
        vec.y = -400000 * Math.sin( phi ) * Math.sin( theta );
        vec.z = -400000 * Math.sin( phi ) * Math.cos( theta );

        this.skybox.material.uniforms.sunPosition.value.copy( vec );
    }

    function sky(){
        this.skybox = new THREE.Sky();
        this.skybox.scale.setScalar( 450000 );
        this.skybox.material.uniforms.turbidity.value = 1;
        this.skybox.material.uniforms.rayleigh.value = 0.01;
        this.skybox.material.uniforms.luminance.value = 1;
        this.skybox.material.uniforms.mieCoefficient.value = 0.0003;
        this.skybox.material.uniforms.mieDirectionalG.value = 0.99995;

        scene.add( this.skybox );
        calculateSunPosition(0)
    }

    function resize(){
        width = window.innerWidth
        height = window.innerHeight
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize( width, height );
    }

    function onInputMove(e){
        e.preventDefault();

        var x, y
        if(e.type == "mousemove"){
            x = e.clientX;
            y = e.clientY;
        }else{
            x = e.changedTouches[0].clientX
            y = e.changedTouches[0].clientY
        }

        mouse.x = x;
        mouse.y = y;

    }
    function onOrientationChange(e) {
        // map the beta axis (X) of the accel event to some "height" along the
        // window to retrofit accel controls for the bump height
        let betaRadian = (e.beta * Math.PI) / 180;
        mouse.x = 0;
        mouse.y = 1 - (window.innerHeight * (0.5 + ((-1 * Math.cos(betaRadian * 2)) / 2)))
    }

    function render(){
        requestAnimationFrame(render)

        // damping mouse for smoother interaction
        mouse.xDamped = lerp(mouse.xDamped, mouse.x, 0.1);
        mouse.yDamped = lerp(mouse.yDamped, mouse.y, 0.1);

        var time = performance.now() * 0.001
        terrain.material.uniforms.time.value = time;
        terrain.material.uniforms.distortCenter.value = Math.sin(time) * 0.1;
        terrain.material.uniforms.maxHeight.value = map(mouse.yDamped, 0, height, 20, 5);

        // transformation of skybox
        let scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrollPercent < 0) {
            scrollPercent = 0
        } else if (scrollPercent > 1) {
            scrollPercent = 1
        }
        terrain.material.uniforms.scrollPercent.value = scrollPercent

            /*
        let lerpedRayleigh = map(scrollPercent, 0, 1, 0.01, 1);
        let lerpedMieDirectionalG = map(scrollPercent, 0, 1, 0.9995, 0.8);
        let lerpedLuminance = map(scrollPercent, 0, 1, 1, 0.1);
        this.skybox.material.uniforms.rayleigh.value = lerpedRayleigh;
        this.skybox.material.uniforms.mieDirectionalG.value = lerpedMieDirectionalG;
        this.skybox.material.uniforms.luminance.value = lerpedLuminance;

        scene.fog.near = map(scrollPercent, 0, 1, 10, 399 );

        calculateSunPosition( scrollPercent );
        */

        renderer.render(scene, camera)

    }

    function map (value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
    }

    function lerp (start, end, amt){
        return (1 - amt) * start + amt * end
    }
}
