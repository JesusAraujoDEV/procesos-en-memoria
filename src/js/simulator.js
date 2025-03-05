class MemorySimulator {
    constructor(clockSpeed = 1) {
        this.clockSpeed = clockSpeed;
        this.interval = null;
        this.memoryManager = new MemoryManager();
    }

    start() {
        this.interval = setInterval(() => {
            this.memoryManager.checkProcesses(this.clockSpeed);
        }, this.clockSpeed * 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    addProcess(name, size, executionTime) {
        const process = new Process(name, size, executionTime);
        this.memoryManager.processes.push(process);
        this.memoryManager.assignMemory(process);
    }

    getProcesses() {
        return this.memoryManager.processes;
    }

    getMBlocks() {
        return this.memoryManager.memoryBlocks;
    }
}

class MemoryManager {
    constructor() {
        this.totalMemory = 0.0;
        this.memoryBlocks = [];
        this.processes = [];
        this.swappedProcesses = []; // Procesos que fueron movidos por swapping
    }

    addMemoryBlock(size) {
        const memoryBlock = new MemoryBlock(size);
        this.memoryBlocks.push(memoryBlock);
        this.totalMemory += size;
    }

    assignMemory(process) {
        let assignedBlock = null;
        for (const memoryBlock of this.memoryBlocks) {
            if (!memoryBlock.assigned && memoryBlock.size >= process.size) {
                memoryBlock.assign(process);
                assignedBlock = memoryBlock;
                break;
            }
        }

        // Si no hay memoria suficiente, se intenta hacer swapping
        if (!assignedBlock) {
            this.swapProcess(process);
        }
    }

    swapProcess(newProcess) {
        for (const block of this.memoryBlocks) {
            if (block.assigned && block.assignedProcess.state === "En espera") {
                // Se mueve el proceso menos prioritario a memoria secundaria (swapping)
                this.swappedProcesses.push(block.assignedProcess);
                block.unassign();
                block.assign(newProcess);
                return;
            }
        }

        console.log(`No hay memoria disponible para ${newProcess.name}, incluso con swapping.`);
    }

    compactMemory() {
        console.log("Compactando memoria...");
        this.memoryBlocks.sort((a, b) => a.assigned - b.assigned); // Mueve los libres al final
    }

    relocateProcess() {
        console.log("Intentando reubicar procesos...");
        for (let i = 0; i < this.memoryBlocks.length; i++) {
            const block = this.memoryBlocks[i];
            if (!block.assigned) {
                for (let j = i + 1; j < this.memoryBlocks.length; j++) {
                    if (this.memoryBlocks[j].assigned) {
                        this.memoryBlocks[i].assign(this.memoryBlocks[j].assignedProcess);
                        this.memoryBlocks[j].unassign();
                        break;
                    }
                }
            }
        }
    }

    checkProcesses(time) {
        for (const block of this.memoryBlocks) {
            if (!block.assigned) continue;

            block.assignedProcess.execute(time);
            if (block.assignedProcess.state === "Terminado") {
                block.unassign();

                // Intentar reubicar o compactar memoria tras liberar un bloque
                this.relocateProcess();
                this.compactMemory();

                // Revisar procesos en espera
                for (const p of this.processes) {
                    if (p.state === "En espera") {
                        this.assignMemory(p);
                    }
                }
            }
        }
    }
}

class MemoryBlock {
    static id = 0;

    constructor(size, assigned = false) {
        this.id = MemoryBlock.id++;
        this.size = size;
        this.assigned = assigned;
        this.assignedProcess = null;
    }

    assign(process) {
        if (!this.assigned) {
            this.assigned = true;
            this.assignedProcess = process;
            this.assignedProcess.activate();
        } else {
            throw new Error(`El bloque de memoria ${this.id} ya está asignado.`);
        }
    }

    unassign() {
        if (this.assigned) {
            this.assigned = false;
            this.assignedProcess = null;
        } else {
            throw new Error(`El bloque de memoria ${this.id} ya está libre.`);
        }
    }
}

class Process {
    static id = 0;

    constructor(name, size, maxExecutionTime, state = "En espera") {
        this.id = Process.id++;
        this.name = name;
        this.size = size;
        this.maxExecutionTime = maxExecutionTime;
        this.executionTime = 0;
        this.state = state;
    }

    activate() {
        if (this.state !== "En ejecución") {
            this.state = "En ejecución";
        } else {
            throw new Error("Este proceso ya está en ejecución.");
        }
    }

    finish() {
        if (this.state !== "Terminado") {
            this.state = "Terminado";
        } else {
            throw new Error("Este proceso ya ha terminado.");
        }
    }

    execute(time) {
        if (this.state !== "En ejecución") {
            throw new Error("Este proceso no está en ejecución.");
        }

        this.executionTime += time;
        if (this.executionTime >= this.maxExecutionTime) {
            this.finish();
        }
    }
}

// DOM

var simulator = new MemorySimulator(1);

function startSimulation() {
    simulator.start();
}

function stopSimulation() {
    simulator.stop();
}

document.querySelector(".process-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = e.target.elements;
    const name = inputs["name"].value;
    const size = parseFloat(inputs["size"].value);
    const executionTime = parseFloat(inputs["executionTime"].value);
    simulator.addProcess(name, size, executionTime);
});

document.querySelector(".mblock-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = e.target.elements;
    const size = parseFloat(inputs["size"].value);
    simulator.memoryManager.addMemoryBlock(size);
});

function updateTable() {
    const processes = simulator.getProcesses();
    const processesTable = document.querySelector(".processes-tbody");
    processesTable.innerHTML = "";
    for (const p of processes) {
        if (p.state !== "Terminado") {
            processesTable.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.size}</td>
                <td>${p.executionTime}</td>
                <td>${p.maxExecutionTime}</td>
                <td>${p.state}</td>
            </tr>
            `;
        }
    }

    const mBlocks = simulator.getMBlocks();
    const mBlocksTable = document.querySelector(".mblocks-tbody");
    mBlocksTable.innerHTML = "";
    for (const b of mBlocks) {
        mBlocksTable.innerHTML += `
        <tr>
            <td>${b.id}</td>
            <td>${b.size}</td>
            <td>${b.assigned ? 'Si' : 'No'}</td>
            <td>${b.assigned ? b.assignedProcess.name : 'Ninguno'}</td>
        </tr>
        `;
    }
}

setInterval(updateTable, 1000);
