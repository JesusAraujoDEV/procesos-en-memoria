export class MemorySimulator {
    constructor(clockSpeed = 1) {
        this.clockSpeed = clockSpeed; // Segundos entre cada verificación de procesos?
        this.interval = null
        this.memoryManager = new MemoryManager()
    }

    start() {
        this.interval = setInterval(() => {
            this.memoryManager.checkProcesses();
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
        const assignBlock = null;
        for (const memoryBlock in this.memoryBlocks) {
            if (memoryBlock.size > process.size) {
                memoryBlock.assign(process)
                break
            }
        }
        if (assignBlock === null) {
            console.error(`Al proceso ${process.name} no se le pudo asignar un bloque de memoria.`)
        }
    }

    checkProcesses(time) {
        for (const block in this.memoryBlocks) {
            if (!block.assigned && block.process) {
                continue
            }

            block.process.execute(time)
            if (!block.assigned && block.process) {
                continue
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
        if (!this.assign) {
            this.assigned = true;
            this.assignedProcess = process
        }
        else {
            throw new Error(`Este bloque de memoria ${this.id} ya está asignado.`)
        }
    }

    unassign() {
        if (this.assign) {
            this.assigned = false;
            this.assignedProcess = null
        }
        else {
            throw new Error(`Este bloque de memoria ${this.id} ya está libre.`)
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
        this.executionTime = 0.0;
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
}