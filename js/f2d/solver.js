var F2D = F2D === undefined ? {} : F2D;

(function(F2D) {
    "use strict";

    F2D.Solver = function(grid, time, windowSize, slabs, slabop) {
        this.grid = grid;
        this.time = time;
        this.windowSize = windowSize;

        // slabs
        this.velocity = slabs.velocity;
        this.density = slabs.density;
        this.velocityDivergence = slabs.velocityDivergence;
        this.velocityVorticity = slabs.velocityVorticity;
        this.pressure = slabs.pressure;

        // slab operations
        this.advect = slabop.advect;
        this.diffuse = slabop.diffuse;
        this.divergence = slabop.divergence;
        this.poissonPressureEq = slabop.poissonPressureEq;
        this.gradient = slabop.gradient;
        this.splat = slabop.splat;
        this.vorticity = slabop.vorticity;
        this.vorticityConfinement = slabop.vorticityConfinement;
        this.boundary = slabop.boundary;

        this.viscosity = 0.3;
        this.applyViscosity = false;
        this.applyVorticity = false;

        // density attributes
        this.source = new THREE.Vector3(0.8, 0.0, 0.0);
        this.ink = new THREE.Vector3(1, 0, 0);
    };

    F2D.Solver.prototype = {
        constructor: F2D.Solver,

        step: function(renderer, mouse) {
            // Realizamos advect del vector de velocidades sobre si mismo
            var temp = this.advect.dissipation;
            this.advect.dissipation = 1;
            this.advect.compute(renderer, this.velocity, this.velocity, this.velocity);
            this.boundary.compute(renderer, this.velocity, -1, this.velocity);
            // Aplicamos mediante advect el vector de velocidades al vector de densidades
            this.advect.dissipation = temp;
            this.advect.compute(renderer, this.velocity, this.density, this.density);

            // Añadimos las fuerzas y el color 
            this.addForces(renderer, mouse);

            // Empezamos el proceso de proyeccion
            this.project(renderer);
        },

        addForces: (function() {
            var point = new THREE.Vector2();
            var force = new THREE.Vector3();
            return function(renderer, mouse) {
                for (var i = 0; i < mouse.motions.length; i++) {
                    var motion = mouse.motions[i];

                    point.set(motion.position.x, this.windowSize.y - motion.position.y);
                    // normalizamos a [0, 1] y escalamos al tamaño del grid
                    point.x = (point.x / this.windowSize.x) * this.grid.size.x;
                    point.y = (point.y / this.windowSize.y) * this.grid.size.y;

                    // Si el click izq estaba presionado añadimos fuerzas al vector de velocidad
                    if (motion.left) {
                        force.set(
                             motion.drag.x,
                            -motion.drag.y,
                             0
                        );
                        this.splat.compute(
                            renderer,
                            this.velocity,
                            force,
                            point,
                            this.velocity
                        );
                        this.boundary.compute(renderer, this.velocity, -1, this.velocity);
                    }

                    // Si el click der estaba presionado añadimos color  al vector de densidad
                    if (motion.right) {
                        this.splat.compute(
                            renderer,
                            this.density,
                            this.source,
                            point,
                            this.density
                        );
                    }
                }
                mouse.motions = [];
            };
        })(),

        project: function(renderer) {
            // Calculamos la divergencia del vector de velocidad
            this.divergence.compute(
                renderer,
                this.velocity,
                this.velocityDivergence
            );

            // Calculamos la presion basados en la divergencia mediante el metodo de jacobi
            this.clearSlab(renderer, this.pressure);
            this.poissonPressureEq.alpha = -this.grid.scale * this.grid.scale;
            this.poissonPressureEq.compute(
                renderer,
                this.pressure,
                this.velocityDivergence,
                this.pressure,
                this.boundary,
                1
            );

            // Obtenemos el gradiente de la presion y lo restamos al vector de velocidad
            this.gradient.compute(
                renderer,
                this.pressure,
                this.velocity,
                this.velocity
            );
            this.boundary.compute(renderer, this.velocity, -1, this.velocity);
        },

        clearSlab: function(renderer, slab) {
            renderer.clearTarget(slab.write, true, false, false);
            slab.swap();
        }
    };

    F2D.Solver.make = function(grid, time, windowSize, shaders) {
        var w = grid.size.x,
            h = grid.size.y;

        var slabs = {
            // vec2
            velocity: F2D.Slab.make(w, h),
            // scalar
            density: F2D.Slab.make(w, h),
            velocityDivergence: F2D.Slab.make(w, h),
            velocityVorticity: F2D.Slab.make(w, h),
            pressure: F2D.Slab.make(w, h),
        };

        var slabop = {
            advect: new F2D.Advect(shaders.advect, grid, time),
            diffuse: new F2D.Jacobi(shaders.jacobivector, grid),
            divergence: new F2D.Divergence(shaders.divergence, grid),
            poissonPressureEq: new F2D.Jacobi(shaders.jacobiscalar, grid),
            gradient: new F2D.Gradient(shaders.gradient, grid),
            splat: new F2D.Splat(shaders.splat, grid),
            vorticity: new F2D.Vorticity(shaders.vorticity, grid),
            vorticityConfinement: new F2D.VorticityConfinement(shaders.vorticityforce, grid, time),
            boundary: new F2D.Boundary(shaders.boundary, grid)
        };

        return new F2D.Solver(grid, time, windowSize, slabs, slabop);
    };

}(F2D));
