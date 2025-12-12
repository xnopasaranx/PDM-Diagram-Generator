let tables = {};
let connections = [];
let isDragging = false;
let isDrawing = false;
let offset = { x: 0, y: 0 };
let sourceTable = null;
let targetTable = null;

// Initializing draw
let draw = SVG().addTo('#arrowLayer').size('100%', '100%');
const container = document.getElementById('container');

container.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    if(container === e.target){ 
      GenerateTaskOnClick(e);
    }
});

document.addEventListener('keydown', (e) => {
    if(e.key === 'Delete'){
        let element = document.getElementsByClassName('selected')[0];
        removeNode(element);
        endSelection();
    }
})

class Task {
    constructor(x, y){
        let id = 0;
        if(Object.keys(tables).length > 0){
            let keys = Object.keys(tables);
            if(keys[0]==0){
                for(const [key, val] of Object.entries(tables)){
                    let next = keys[(keys.indexOf(key) + 1) % keys.length]
                    if(Object.keys(tables).length > 1 && (tables[next] - tables[key]) > 1){
                        id = tables[key] + 1;
                        break;
                    } else if (Object.keys(tables).length > 1 && (next - key) === 1){
                        id = Object.keys(tables).length;
                    } else {
                        id = Object.keys(tables).length;
                    }
                }
            }
        }
        tables[id] = id;
        this.id = id;
        this.x = x;
        this.y = y;
        this.connection = [];
    }

    ConvertTaskNumberToLetter() {
        return String.fromCharCode(65 + this.id);
    }

    GenTable() {
        const table = document.createElement('table');
        table.id = String(this.id);

        table.innerHTML =
        `<tr>
            <td colspan="2">ES <input type="text" class="numtab" id="es-${this.id}"></td>
            <td colspan="2">EF <input type="text" class="numtab" id="ef-${this.id}"></td>
        </tr>
        <tr>
            <th colspan="4">${this.ConvertTaskNumberToLetter()}</th>
        </tr>
        <tr>
            <td>LS <br> <input type="text" class="numtab" id="ls-${this.id}"></br></td>
            <td>Dur <br> <input type="text" class="numtab" id="dur-${this.id}"></br></td>
            <td>TF <br><input type="text" class="numtab" id="tf-${this.id}"></br></td>
            <td>LF <br><input type="text" class="numtab" id="lf-${this.id}"></br></td>
        </tr>`;
    
        // Setting the initial position of the tables to the top-left corner
        // use passed coordinates to position element, if defined
        table.style.left = `${this.x}px`;
        table.style.top = `${this.y}px`;
    
        setupDraggable(table);
        setupSelectable(table);
        container.appendChild(table);
    }
}


function GenerateTaskOnClick(e) {
    // Generate this task after a click event, to make editing easier
    let table = new Task(e.offsetX, e.offsetY);
    table.GenTable();
}

function setupDraggable(element) {
    element.addEventListener('mousedown', (e) => {
        // only enter dragging mode if left button is used
        if (!isDrawing && e.target.tagName.toLowerCase() !== 'input' && e.button === 0) {
            isDragging = true;
            currentTable = element;
            offset.x = e.clientX - element.offsetLeft;
            offset.y = e.clientY - element.offsetTop;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging && currentTable) {
            currentTable.style.left = `${e.clientX - offset.x}px`;
            currentTable.style.top = `${e.clientY - offset.y}px`;
            UpdateArrows();
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        currentTable = null;
    });
}


function select(el){
    sourceTable = el;
    isDrawing = true;
    sourceTable.classList.add('selected')
    let tablelist = document.getElementsByTagName('table')
    for(el of tablelist){
        if(!el.classList.contains('selected')){
            el.classList.add('hover')
        }
    }
}

function connect(el){
    targetTable = el;
    let connection = {from: sourceTable.id, to: targetTable.id};
    let exists = connections.some(e => (e.from === sourceTable.id && e.to === targetTable.id) || (e.from === targetTable.id && e.to === sourceTable.id));
    if((sourceTable !== targetTable) && !exists){
        connections.push(connection);
    } else if ((sourceTable !== targetTable) && exists){
        connections = connections.filter(obj => !((obj.from === connection.from && obj.to === connection.to) || (obj.to === connection.from && obj.from === connection.to)))
    }
    endSelection();
}

function removeEl(el){
    el.remove();
}

function removeNode(el){
    let id = el.id;
    delete tables[id];
    removeEl(el);
}

function endSelection(){
    UpdateArrows();
    sourceTable = null;
    targetTable = null;
    isDrawing = false;
    let tablelist = document.getElementsByTagName('table')
    for(el of tablelist){
        el.classList.remove('selected', 'hover')
    }
}

function setupSelectable(element) {
    element.addEventListener('contextmenu', (e) => {
        if (!isDrawing && e.target.tagName.toLowerCase() !== 'input' ) {
            select(element);
        }
    });
    
    element.addEventListener('contextmenu', (e) => {
        if (!isDrawing && e.target.tagName.toLowerCase() !== 'input' ) {
            select(element);
        }
    });

    element.addEventListener('click', (e) => {
        if (isDrawing && e.target.tagName.toLowerCase() !== 'input') {
            connect(element);
        }
    });
}

function ConvertTaskLetterToNumber(taskLetter) {
    const uppercaseLetter = taskLetter.toUpperCase();
    const charCode = uppercaseLetter.charCodeAt(0);
    return charCode - 65;
}

function UpdateArrows() {
    // Clearing existing content
    draw.clear();

    const PADDING = 5;
    const BORDER = 1;
    const TOTAL_OFFSET = PADDING + BORDER;
    const CONNECTION_SPACING = 15;

    // Counting connections from and to tables
    const fromConnectionCounts = {};
    const toConnectionCounts = {};
    const fromTableConnections = {};
    const toTableConnections = {};

    connections.forEach(conn => {
        fromConnectionCounts[conn.from] = (fromConnectionCounts[conn.from] || 0) + 1;
        toConnectionCounts[conn.to] = (toConnectionCounts[conn.to] || 0) + 1;
        
        if (!fromTableConnections[conn.from]) {
            fromTableConnections[conn.from] = 0;
        }
        if (!toTableConnections[conn.to]) {
            toTableConnections[conn.to] = 0;
        }
    });

    connections.forEach(conn => {
        const fromTable = document.getElementById(String(conn.from));
        const toTable = document.getElementById(String(conn.to));

        if (fromTable && toTable) {
            const fromIndex = fromTableConnections[conn.from]++;
            const toIndex = toTableConnections[conn.to]++;
            const totalFromConnections = fromConnectionCounts[conn.from];
            const totalToConnections = toConnectionCounts[conn.to];

            // Calculating centers
            const fromCenter = {
                x: fromTable.offsetLeft + (fromTable.offsetWidth / 2),
                y: fromTable.offsetTop + (fromTable.offsetHeight / 2)
            };

            const toCenter = {
                x: toTable.offsetLeft + (toTable.offsetWidth / 2),
                y: toTable.offsetTop + (toTable.offsetHeight / 2)
            };

            // Determining directions
            const horizontalDistance = Math.abs(fromCenter.x - toCenter.x);
            const verticalDistance = Math.abs(fromCenter.y - toCenter.y);
            const isHorizontal = horizontalDistance > verticalDistance;

            // Calculatig offsets
            const fromOffset = CONNECTION_SPACING * (fromIndex - (totalFromConnections - 1) / 2);
            const toOffset = CONNECTION_SPACING * (toIndex - (totalToConnections - 1) / 2);

            const points = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };

            if (isHorizontal) {
                if (fromCenter.x < toCenter.x) {
                    points.from.x = fromTable.offsetLeft + fromTable.offsetWidth - TOTAL_OFFSET;
                    points.to.x = toTable.offsetLeft + TOTAL_OFFSET;
                } else {
                    points.from.x = fromTable.offsetLeft + TOTAL_OFFSET;
                    points.to.x = toTable.offsetLeft + toTable.offsetWidth - TOTAL_OFFSET;
                }
                points.from.y = fromCenter.y + fromOffset;
                points.to.y = toCenter.y + toOffset;
            } else {
                if (fromCenter.y < toCenter.y) {
                    points.from.y = fromTable.offsetTop + fromTable.offsetHeight - TOTAL_OFFSET;
                    points.to.y = toTable.offsetTop + TOTAL_OFFSET;
                } else {
                    points.from.y = fromTable.offsetTop + TOTAL_OFFSET;
                    points.to.y = toTable.offsetTop + toTable.offsetHeight - TOTAL_OFFSET;
                }
                points.from.x = fromCenter.x + fromOffset;
                points.to.x = toCenter.x + toOffset;
            }

            const midX = points.from.x + (points.to.x - points.from.x) / 2;

            // Drawing Arrows
            const arrowSize = 10;
            const offsetFromEdge = arrowSize;

            let arrowPoints;
            let pathEndPoint;

            if (isHorizontal) {
                if (fromCenter.x < toCenter.x) {
                    // Arrow pointing right
                    arrowPoints = [
                        [points.to.x - arrowSize - offsetFromEdge, points.to.y - arrowSize/2],
                        [points.to.x - offsetFromEdge, points.to.y],
                        [points.to.x - arrowSize - offsetFromEdge, points.to.y + arrowSize/2]
                    ];
                    pathEndPoint = [points.to.x - arrowSize - offsetFromEdge, points.to.y];
                } else {
                    // Arrow pointing left
                    arrowPoints = [
                        [points.to.x + arrowSize + offsetFromEdge, points.to.y - arrowSize/2],
                        [points.to.x + offsetFromEdge, points.to.y],
                        [points.to.x + arrowSize + offsetFromEdge, points.to.y + arrowSize/2]
                    ];
                    pathEndPoint = [points.to.x + arrowSize + offsetFromEdge, points.to.y];
                }
            } else {
                if (fromCenter.y < toCenter.y) {
                    // Arrow pointing down
                    arrowPoints = [
                        [points.to.x - arrowSize/2, points.to.y - arrowSize - offsetFromEdge],
                        [points.to.x, points.to.y - offsetFromEdge],
                        [points.to.x + arrowSize/2, points.to.y - arrowSize - offsetFromEdge]
                    ];
                    pathEndPoint = [points.to.x, points.to.y - arrowSize - offsetFromEdge];
                } else {
                    // Arrow pointing up
                    arrowPoints = [
                        [points.to.x - arrowSize/2, points.to.y + arrowSize + offsetFromEdge],
                        [points.to.x, points.to.y + offsetFromEdge],
                        [points.to.x + arrowSize/2, points.to.y + arrowSize + offsetFromEdge]
                    ];
                    pathEndPoint = [points.to.x, points.to.y + arrowSize + offsetFromEdge];
                }
            }

            // Drawing arrowheads
            draw.polygon(arrowPoints).fill('#333');

            // Drawing the path
            draw.path(
                `M ${points.from.x} ${points.from.y} 
                ${isHorizontal 
                    ? `L ${midX} ${points.from.y} 
                    L ${midX} ${pathEndPoint[1]}`
                    : `L ${points.from.x} ${(points.from.y + pathEndPoint[1]) / 2}
                    L ${pathEndPoint[0]} ${(points.from.y + pathEndPoint[1]) / 2}`
                }
                L ${pathEndPoint[0]} ${pathEndPoint[1]}`
            ).fill('none').stroke({ width: 1, color: '#333' });
        }
    });
}

function ClearConnections() {
    connections = [];
    UpdateArrows();
}
