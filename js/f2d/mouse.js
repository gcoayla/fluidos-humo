var F2D = F2D === undefined ? {} : F2D;

(function(F2D) {
    "use strict";
    // Inicializacion de mouse y listeners
    F2D.Mouse = function(grid) {
        this.grid = grid;

        this.left = false;
        this.right = false;
        this.position = new THREE.Vector2();
        this.motions = [];

        document.addEventListener("mousedown", this.mouseDown.bind(this), false);
        document.addEventListener("mouseup", this.mouseUp.bind(this), false);
        document.addEventListener("mousemove", this.mouseMove.bind(this), false);
        document.addEventListener("contextmenu", this.contextMenu.bind(this), false);
    };

    F2D.Mouse.prototype = {
        constructor: F2D.Mouse,
        // Evento en boton mouse presionado 0:click izq 2:click der
        mouseDown: function(event) {
            this.position.set(event.clientX, event.clientY);
            this.left = event.button === 0 ? true : this.left;
            this.right = event.button === 2 ? true : this.right;
        },
        // Evento en boton mouse levantado
        mouseUp: function(event) {
            event.preventDefault();
            this.left = event.button === 0 ? false : this.left;
            this.right = event.button === 2 ? false : this.right;
        },
        // Evento en movimiento de mouse
        mouseMove: function(event) {
            event.preventDefault();
            var r = this.grid.scale;

            var x = event.clientX;
            var y = event.clientY;

            if (this.left || this.right) {
                var dx = x - this.position.x;
                var dy = y - this.position.y;

                var drag = {
                    x: Math.min(Math.max(dx, -r), r),
                    y: Math.min(Math.max(dy, -r), r)
                };

                var position = {
                    x: x,
                    y: y
                };
                // [motions] almacena un array de objetos que contiene los movimientos realizados
                this.motions.push({
                    left: this.left,
                    right: this.right,
                    drag: drag,
                    position: position
                });
            }

            this.position.set(x, y);
        },
        // Se evita el comportamiento habitual del click derecho
        contextMenu: function(event) {
            event.preventDefault();
        }
    };

}(F2D));
