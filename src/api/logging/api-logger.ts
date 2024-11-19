import { window, type OutputChannel } from "vscode"
import { ApiHandler } from "../index"
import type { Anthropic } from "@anthropic-ai/sdk"
import { ApiStream } from "../transform/stream"

export class LoggingApiHandler implements ApiHandler {
    private outputChannel: OutputChannel
    
    constructor(
        private wrapped: ApiHandler,
        outputChannel?: OutputChannel
    ) {
        this.outputChannel = outputChannel || window.createOutputChannel("Cline LLM Communications")
    }

    async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
        // Log the outgoing request
        this.outputChannel.appendLine("\n=== Outgoing Request ===")
        this.outputChannel.appendLine(`System Prompt: ${systemPrompt}`)
        this.outputChannel.appendLine("Messages:")
        messages.forEach((msg, i) => {
            this.outputChannel.appendLine(`[${i}] ${msg.role}: ${JSON.stringify(msg.content)}`)
        })
        
        // Get the stream from the wrapped handler
        const stream = this.wrapped.createMessage(systemPrompt, messages)
        
        // Log and yield each response chunk
        this.outputChannel.appendLine("\n=== Incoming Response ===")
        for await (const chunk of stream) {
            this.outputChannel.appendLine(`Chunk: ${JSON.stringify(chunk)}`)
            yield chunk
        }
    }

    getModel() {
        return this.wrapped.getModel()
    }
}
