function randomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = {
            top: true,
            right: true,
            bottom: true,
            left: true,
        };
        this.visited = false;
    }

    draw(ctx, cellWidth) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();

        const px = this.x * cellWidth;
        const py = this.y * cellWidth;

        ctx.moveTo(px, py);

        if (this.walls.left) {
            ctx.lineTo(px, py + cellWidth);
        } else {
            ctx.moveTo(px, py + cellWidth);
        }

        if (this.walls.bottom) {
            ctx.lineTo(px + cellWidth, py + cellWidth);
        } else {
            ctx.moveTo(px + cellWidth, py + cellWidth);
        }

        if (this.walls.right) {
            ctx.lineTo(px + cellWidth, py);
        } else {
            ctx.moveTo(px + cellWidth, py);
        }

        if (this.walls.top) {
            ctx.lineTo(px, py);
        } else {
            ctx.moveTo(px, py);
        }

        ctx.stroke();

        //pacman tema
        ctx.fillStyle = 'yellow';
        const dotRadius = cellWidth / 8;
        ctx.beginPath();
        ctx.arc(px + cellWidth / 2, py + cellWidth / 2, dotRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    // find naboerne i grid vha. this.x og this.y
    unvisitedNeighbors(grid) {
        let neighbors = [];

        // Vi er ikke den nordligste celle
        if (this.y > 0) {
            const nord_x = this.x;
            const nord_y = this.y - 1;
            const nord_nabo = grid[nord_x][nord_y];
            if (!nord_nabo.visited) {
                neighbors.push(nord_nabo);
            }
        }

        // Vi er ikke cellen mest til venstre
        if (this.x > 0) {
            const venstre_x = this.x - 1;
            const venstre_y = this.y;
            const venstre_nabo = grid[venstre_x][venstre_y];
            if (!venstre_nabo.visited) {
                neighbors.push(venstre_nabo);
            }
        }

        // Vi er ikke den sydligste celle
        if (this.y < grid[0].length - 1) {
            const syd_x = this.x;
            const syd_y = this.y + 1;
            const syd_nabo = grid[syd_x][syd_y];
            if (!syd_nabo.visited) {
                neighbors.push(syd_nabo);
            }
        }

        // Vi er ikke cellen mest til højre
        if (this.x < grid.length - 1) {
            const højre_x = this.x + 1;
            const højre_y = this.y;
            const højre_nabo = grid[højre_x][højre_y];
            if (!højre_nabo.visited) {
                neighbors.push(højre_nabo);
            }
        }

        return neighbors;
    }

    punchWallDown(otherCell) {
        const dx = this.x - otherCell.x;
        const dy = this.y - otherCell.y;

        if (dx === 1) {
            // otherCell er til venstre for this
            this.walls.left = false;
            otherCell.walls.right = false;
        } else if (dx === -1) {
            // otherCell er til højre for this
            this.walls.right = false;
            otherCell.walls.left = false;
        } else if (dy === 1) {
            // otherCell er over this
            this.walls.top = false;
            otherCell.walls.bottom = false;
        } else if (dy === -1) {
            // otherCell er under this
            this.walls.bottom = false;
            otherCell.walls.top = false;
        }
    }
}

class Maze {
    constructor(cols, rows, canvas) {
        this.grid = [];
        this.cols = cols;
        this.rows = rows;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellWidth = canvas.width / cols;
        this.randomnessPercent = 25; //25% chance for at vælge en tilfældig celle i stedet for den senest besøgte
        this.initializeGrid();
    }

    initializeGrid() {
        for (let i = 0; i < this.rows; i += 1) {
            this.grid.push([]);
            for (let j = 0; j < this.cols; j += 1) {
                this.grid[i].push(new Cell(i, j));
            }
        }
    }

    draw() {
        //tilføjelse af baggrundsfarve sort i steden for hvid
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.rows; i += 1) {
            for (let j = 0; j < this.cols; j += 1) {
                this.grid[i][j].draw(this.ctx, this.cellWidth);
            }
        }
    }

    generateAnimated(speed = 20) {
        const start_x = randomInteger(0, this.cols);
        const start_y = randomInteger(0, this.rows);
        let currentCell = this.grid[start_x][start_y];
        let stack = [];
        currentCell.visited = true;

        const step = () => {
            let unvisitedNeighbors = currentCell.unvisitedNeighbors(this.grid);
            if (unvisitedNeighbors.length > 0) {
                const randomNeighborCell = unvisitedNeighbors[randomInteger(0, unvisitedNeighbors.length)];
                currentCell.punchWallDown(randomNeighborCell);
                stack.push(currentCell);
                currentCell = randomNeighborCell;
                currentCell.visited = true;
            } else {
                if (stack.length > 0) {
                    const shouldPickRandom = Math.random() < (this.randomnessPercent / 100);
                    if (shouldPickRandom) {
                        const randIndex = randomInteger(0, stack.length);
                        currentCell = stack.splice(randIndex, 1)[0];
                    } else {
                        currentCell = stack.pop();
                    }
                } else {
                    currentCell = null; // færdig
                }
            }

            // Tegn efter hvert step
            this.draw();

            if (currentCell != null) {
                setTimeout(step, speed); // kalder sig selv igen efter "speed" ms
            } else {
                // Når færdig: lav loops og indgange
                this.sprinkleLoops(10);
                this.createEntrances();
                this.draw();
                console.log("Maze generation complete!");
            }
        };

        step(); // start animationen
    }

    // Fjerner vægge for at skabe loops i labyrinten
    sprinkleLoops(loopPercent = 8) {
        const p = loopPercent / 100;
        const xMax = this.grid.length;
        const yMax = this.grid[0].length;

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                // Prøv højre nabo
                if (x + 1 < xMax && Math.random() < p) {
                    const a = this.grid[x][y];
                    const b = this.grid[x + 1][y];
                    if (a.walls.right && b.walls.left) {
                        a.punchWallDown(b);
                    }
                }
                // Prøv nedenfor
                if (y + 1 < yMax && Math.random() < p) {
                    const a = this.grid[x][y];
                    const b = this.grid[x][y + 1];
                    if (a.walls.bottom && b.walls.top) {
                        a.punchWallDown(b);
                    }
                }
            }
        }
    }

// Laver en indgang og udgang i labyrinten
    createEntrances() {
        const start = this.grid[0][0];
        start.walls.top = false;

        const xMax = this.grid.length;
        const yMax = this.grid[0].length;
        const goal = this.grid[xMax - 1][yMax - 1];
        goal.walls.bottom = false;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const maze = new Maze(20, 20, canvas);

    maze.generateAnimated(10); // 20ms per step — lower = faster


    console.log(maze);
})

