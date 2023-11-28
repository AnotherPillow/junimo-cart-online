class Junimo {
    constructor() {
        //this.container = document.querySelector('.junimoContainer');
        this.cartContainer = document.querySelector('.cartContainer');
    }
    Show() {
        let junimoEl = document.createElement('div');
        junimoEl.classList.add('junimo');
        this.junimo = junimoEl;
        this.cartContainer.appendChild(junimoEl);
    }
    ShowCart() {

    }
}

class JunimoAnimation {
    constructor(junimo) {
        this.junimo = junimo.junimo;
        this.step = 0;
    }
    Animate(size) {
        let el = this.junimo;
        //console.log(el);
        this.animation = setInterval(() => {
            let mod = this.step % 4;
            this.currentOffset = size * mod + 'px';
            el.style.backgroundPositionX = this.currentOffset;
            //console.log(this.step, this.currentOffset, mod);
            this.step++;
        }, 100);
    }
    Stop() {
        clearInterval(this.animation);
    }
}

class Cart {
    constructor() {
        this.container = document.querySelector('.cartContainer');
    }
    Show() {
        this.cart = document.createElement('div');
        this.cart.classList.add('cart', 'ground');
        this.container.appendChild(this.cart);

        this.higherCart = document.createElement('div');
        this.higherCart.classList.add('higherCart');
        this.container.appendChild(this.higherCart);
    }
    Airborne() {
        this.cart.classList.add('air');
        this.higherCart.classList.add('air');
        this.cart.classList.remove('ground');
        this.higherCart.classList.remove('ground');

        this.airborne = true;
    }
    Grounded() {
        this.cart.classList.add('ground');
        this.higherCart.classList.add('ground');
        this.cart.classList.remove('air');
        this.higherCart.classList.remove('air');

        this.airborne = false;
    }
    Fall(y,lowestValidY, cont) {
        if (!this.fallStartMs) {
            this.fallStartMs = Date.now();
        }
        this.fallDurationMs = Date.now() - this.fallStartMs;
        
        this.container.style.bottom = y + 'px';
        
        let fallAmount = 1.2 * this.fallDurationMs / 750
        let nextY = y - fallAmount;
        //make sure it can't go below the lowest valid Y
        if (nextY < lowestValidY) {
            nextY = lowestValidY;
        }
        if (cont) return this.Fall(nextY, lowestValidY, false);
        return nextY
    }
}

class Game {
    loops = 16;
    removeCol = 0;
    score = 0;
    spacePressed = false;
    spaceStartMs = 0;
    toJump = 0;
    jumping = false;
    constructor() {
        this.junimo = new Junimo();
        this.junimo.Show();
        this.junimoAnimation = new JunimoAnimation(this.junimo);
        this.junimoAnimation.Animate(64);

        this.cart = new Cart();
        this.cart.Show();

        this.lowestValidY = 0;
        this.cartY = 0;

        this.map = new Map();
        this.lowestValidY = this.map.newLowestValidY;
        this.cartY = this.map.newCartY + 1;
    }
    Loop() {
        this.loopInterval = setInterval(() => {
            if (this.cartY === 0) {
                this.GameOver();
            }
            this.loops++;
            
            if (this.cartY > this.lowestValidY || this.cartY < this.groundLevel && !this.ignoreAir) {
                this.case = (this.cartY > this.lowestValidY) ? 'above' : 'below';
                
                //console.log('falling');
                
                switch (this.case) {
                    case 'above':
                        this.cartY = this.cart.Fall(this.cartY, this.lowestValidY,true);
                        this.cartY = this.cart.Fall(this.cartY, this.lowestValidY,true);
                        break;
                    case 'below':
                        this.cartY = this.cart.Fall(this.cartY, 0,true);
                        this.cartY = this.cart.Fall(this.cartY, 0,true);
                        break;
                }
                
                this.cart.Airborne();
            } else if (this.cart.airborne && this.cartY === this.lowestValidY && !this.ignoreAir) {
                this.cart.fallStartMs = null;
                this.cart.fallDurationMs = null;
                this.cart.Grounded();
            }
            this.mapLeft = this.map.container.style.left.replace('px', '');
            this.map.container.style.left = (parseInt(this.mapLeft) - 1).toString() + 'px';
            let mod = this.loops % 64;
            if (mod === 0) {

                this.removeCol++;
                this.score++;
                
                //this.map.container.style.left = '32px';
                
                
                
                //console.log(this.lowestValidY);
                //this.cartY = this.lowestValidY + 1;

                //add a new column
                this.map.columns.push(new MapColumn(this.map.backgroundType));
            } else if (mod === 48) {
                this.lowestValidY = (this.map.columns[Math.ceil((this.loops / 64)) + 1].bottomCount * 64) + 20;
            }
            this.groundLevel = this.lowestValidY;
            let lengthPressed = Date.now() - this.spaceStartMs;

            if (lengthPressed < 500) {
                this.ignoreAir = true;
                this.cartY += 10;
                this.toJump +1;
            }
            if (this.toJump > 0 && this.ignoreAir) {
                this.cartY += 6;
                this.toJump--;
            } else if (this.toJump === 0 && this.ignoreAir) {
                this.ignoreAir = false;
            }
            
            
        }, 10);
    }
    OnDown(e) {
        if (this.cart.airborne) return;
        this.ignoreAir = true;
        this.spaceStartMs = Date.now();
        this.ignoreAir = false;
        this.cart.Airborne();
        this.toJump = 1;
    }

    OnUp(e) {
        this.spaceDurationMs = Date.now() - this.spaceStartMs;
    }

    AddEventListeners() {
        document.addEventListener('keydown', (e) => {
            console.log(this.cart.airborne)
            if (e.key !== ' ') return;
            this.spacePressed = true;
            this.OnDown(e);
        
            
        });
        document.addEventListener('keyup', (e) => {
            if (e.key !== ' ') return;
            this.spacePressed = false;

            this.OnUp(e);
        
        });

        document.querySelector('.mapContainer').addEventListener('mousedown', (e) => {
            this.spacePressed = true;
            this.OnDown(e);
        });

        document.querySelector('.mapContainer').addEventListener('mouseup', (e) => {
            this.spacePressed = false;
            this.OnUp(e);
        });


    }
    GameOver() {
        clearInterval(this.loopInterval);
        this.junimoAnimation.Stop();
        let modal = new GameOverModal();
        console.log(this.score)
        modal.Show(this.score);

    }
}
class Map {
    backgroundType = 0;
    extraCols = 0;
    maxCols = Math.floor(document.body.getBoundingClientRect().width / 64) + this.extraCols;
    columns = [];
    constructor() {
        this.container = document.querySelector('.mapContainer');
        for (let i = 0; i < this.maxCols; i++) {
            this.columns[i] = new MapColumn(this.backgroundType, 
                    i < 5 ? 5 : null
                );
            //check if it is in extra columns
            // if (i > this.maxCols - this.extraCols - 1) {
            //     this.columns[i].column.classList.add('hide');
            // }
            if (i === 1) {
                this.newLowestValidY = (this.columns[i].bottomCount * 64) + 20;
                this.newCartY = this.newLowestValidY;
            }
            this.backgroundType++;
        }
    }
}
class MapColumn {
    maxHeight = 9;
    bottomEls = [];
    constructor(backgroundType = 0, forcedHeight = null) {
        this.container = document.querySelector('.mapContainer');
        
        this.height = Math.floor(Math.random() * this.maxHeight) + 1;
        this.bottomCount = forcedHeight ?? this.height - 1; 
        
        this.column = document.createElement('div');
        this.column.classList.add('mapColumn');
        
        for (let i = 0; i < this.bottomCount; i++) {
            this.bottomEls[i] = document.createElement('div');
            this.bottomEls[i].classList.add('bottom');
            let backgroundURL = `url("images/bottom_${backgroundType % 2}.png")`;
            this.bottomEls[i].style = `--bottom-amount: ${(i * 64) + 64}px; background-image: ${backgroundURL};`;
            this.column.appendChild(this.bottomEls[i]);
        }
        let top = new ColumnTop(this.bottomCount);
        this.column.appendChild(top);

        this.container.appendChild(this.column);
    }
}
class ColumnTop {
    constructor(index) {
        let el = document.createElement('div');
        el.classList.add('bottom');
        let backgroundURL = `url("images/track4.png")`;
        el.style = `--bottom-amount: ${(index * 64) + 64}px; background-image: ${backgroundURL};`;
        return el
    }
}
class GameOverModal {
    consutructor() {
        return;
    }
    Show(score) {
        this.modal = document.createElement('div');
        this.modal.classList.add('modal');
        this.modal.innerHTML = `<div class="modalContent">
            <h1>Game Over</h1>
            <h2>Score: ${score}</h2>
            <button onclick='document.location.href = document.location.href'></button>
            `;
            console.log(this.modal)
        document.body.appendChild(this.modal);
    }
}