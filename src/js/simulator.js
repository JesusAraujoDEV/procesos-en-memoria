

/// Clases


class MemorySimulator {
    constructor(clockSpeed = 1) {
        this.clockSpeed = clockSpeed; // Segundos entre cada verificación de procesos?
        this.interval = null
        this.memoryManager = new MemoryManager()
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
        this.memoryManager.assignMemory(process)
    }

    getProcesses() {
        const processes = []
        for (const mBlock of this.memoryManager.memoryBlocks) {
            if (mBlock.assigned) {
                processes.push(mBlock.assignedProcess)
            }
        }
        return processes
    }
}

class MemoryManager {
    constructor() {
        this.totalMemory = 0.0;
        this.memoryBlocks = [];
    }

    addMemoryBlock(size) {
        const memoryBlock = new MemoryBlock(size);
        this.memoryBlocks.push(memoryBlock);
        this.totalMemory += size;
    }

    assignMemory(process) {
        let assignedBlock = null;
        for (const memoryBlock of this.memoryBlocks) {
            if (memoryBlock.size > process.size && !memoryBlock.assigned) {
                memoryBlock.assign(process)
                assignedBlock = memoryBlock
                break
            }
        }
        if (assignedBlock === null) {
            console.error(`Al proceso ${process.name} no se le pudo asignar un bloque de memoria.`)
        }   
    }

    checkProcesses(time) {
        for (const block of this.memoryBlocks) {
            if (!block.assigned) {
                continue
            }

            block.assignedProcess.execute(time)
            if (!block.assignedProcess.state) {
                block.unassign()
            }
        }
    }
}

class MemoryBlock {
    static id = 0;

    constructor (size, assigned = false) {
        this.id = MemoryBlock.id++;
        this.size = size;
        this.assigned = assigned;
        this.assignedProcess = null
    }

    assign(process) {
        if (!this.assigned) {
            this.assigned = true;
            this.assignedProcess = process
            this.assignedProcess.activate()
        }
        else {
            throw new Error(`El bloque de memoria ${this.id} ya está asignado.`)
        }
    }

    unassign() {
        if (this.assigned) {
            this.assigned = false;
            this.assignedProcess = null
        }
        else {
            throw new Error(`El bloque de memoria ${this.id} ya está libre.`)
        }
    }
}

class Process {
    static id = 0;

    constructor(name, size, maxExecutionTime, state = false) {
        this.id = Process.id++;
        this.name = name;
        this.size = size;
        this.maxExecutionTime = maxExecutionTime;
        this.executionTime = 0;
        this.state = state;
    }

    activate() {
        if (!this.state) {
            this.state = true;
        }
        else {
            throw new Error("Este proceso ya está activo.")
        }
    }

    deactivate() {
        if (this.state) {
            this.state = false;
        }
        else {
            throw new Error("Este proceso ya está desactivado?.")
        }
    }

    execute(time) {
        if (!this.state) {
            throw new Error("Este proceso no está activo.")
        }

        this.executionTime += time;
        if (this.executionTime >= this.maxExecutionTime) {
            this.deactivate()
        }
    }

    __str__() {
        return this.name
    }
}


// DOM


var simulator = new MemorySimulator(1);

function startSimulation() {
    simulator.start();
    console.log("aa")
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
})

document.querySelector(".mblock-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = e.target.elements;
    const size = parseFloat(inputs["size"].value);
    simulator.memoryManager.addMemoryBlock(size)
    console.log(simulator.memoryManager.totalMemory)
})

function updateTable() {
    const processes = simulator.getProcesses();
    const processesTable = document.querySelector(".processes-tbody");
    processesTable.innerHTML = ""
    for (const p of processes) {
        processesTable.innerHTML += `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.size}</td>
        </tr>
        `
    }
}

setInterval(updateTable, 1000)
