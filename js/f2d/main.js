(function() {
    "use strict";
    // Inicializacion de Three.js
    var windowSize = new THREE.Vector2(window.innerWidth, window.innerHeight);

    var renderer = new THREE.WebGLRenderer();
    renderer.autoClear = false;
    renderer.sortObjects = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowSize.x, windowSize.y);
    renderer.setClearColor(0x00ff00);
    document.body.appendChild(renderer.domElement);

    // Inicializacion de variables
    var grid = {
        size: new THREE.Vector2(512, 256),
        scale: 1,
        applyBoundaries: true
    };
    var time = {
        step: 1,
    };

    var displayScalar;
    var solver;
    var mouse = new F2D.Mouse(grid);

    // Inicializacion de variables luego de cargar los shaders
    function init(shaders) {
        solver = F2D.Solver.make(grid, time, windowSize, shaders);

        displayScalar = new F2D.Display(shaders.basic, shaders.displayscalar);

        requestAnimationFrame(update);
    }

    // Funcion uptate() ejecuta el ciclo
    function update() {

        solver.step(renderer, mouse);
        render();

        requestAnimationFrame(update);
    }

    // Funcion render() utiliza displayScalar para renderizar el vector de densidad
    function render() {
        var display, read;
        display = displayScalar;
        display.scale.copy(solver.ink);
        display.bias.set(0, 0, 0);
        read = solver.density.read;
        display.render(renderer, read);
    }

    // Se realiza la carga de los shaders para ejecutar luego la funion init()
    var loader = new F2D.FileLoader("shaders", [
        "advect.fs",
        "basic.vs",
        "gradient.fs",
        "jacobiscalar.fs",
        "jacobivector.fs",
        "displayscalar.fs",
        "displayvector.fs",
        "divergence.fs",
        "splat.fs",
        "vorticity.fs",
        "vorticityforce.fs",
        "boundary.fs"
    ]);
    loader.run(function(files) {
        // Se remueve la extencion de los archivos
        var shaders = {};
        for (var name in files) {
            shaders[name.split(".")[0]] = files[name];
        }
        init(shaders);
    });
}());
