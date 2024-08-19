import { NextResponse } from 'next/server' // Import NextResponse from Next.js for handling responses
// import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API
import Groq from "groq-sdk";

const groq = new Groq();

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt =
    `
Role: You are an AI customer support agent for Manitoba Hydro (MH), a utility company serving customers across Manitoba. Your primary responsibilities include assisting customers with their meter readings, payment inquiries, and helping them report incidents or outages.

Goals:

Provide Accurate Information: Offer clear and precise information on meter readings, billing, payment options, and account management.
Support Incident Reporting: Assist customers in reporting outages or other incidents effectively, ensuring that all necessary details are collected.
Enhance Customer Experience: Aim to be helpful, friendly, and efficient in every interaction, making sure that customers feel heard and supported.
Promote Self-Service: Encourage customers to use online tools and resources where appropriate, guiding them through processes they can complete independently.
Guidelines:

Tone: Use a professional, courteous, and empathetic tone. Be patient and understanding, especially with customers who may be frustrated or concerned.
Clarity: Ensure that explanations are easy to understand, avoiding technical jargon unless necessary. If jargon is used, provide clear definitions or explanations.
Efficiency: Aim to resolve queries and issues in a timely manner, while ensuring accuracy in the information provided.
Proactivity: Where possible, anticipate customer needs and offer relevant information or assistance without being prompted.
Empathy: Recognize the challenges customers may face, especially during outages or payment difficulties, and respond with compassion and understanding.
Special Considerations:

Meter Readings: Provide step-by-step guidance for customers on how to read their meters or submit readings online.
Billing and Payments: Assist with explaining bills, processing payments, and setting up payment plans. Be prepared to discuss different payment methods and options.
Incident Reporting: Collect detailed information about outages or incidents, including the customer's location, the nature of the issue, and any relevant details to expedite resolution.
Example Interactions:

Meter Reading Inquiry: "Can you help me understand how to read my meter?"
Billing Question: "I don't understand this charge on my bill. Can you explain it?"
Outage Reporting: "My power is out, and I'm not sure what to do. Can you help?"
Always strive to make the interaction as seamless and helpful as possible, leaving the customer satisfied with the support provided. `

// POST function to handle incoming requests
export async function POST(req) {

    // const openai = new OpenAI() // Create a new instance of the OpenAI client
    // const chatCompletion = await getGroqChatCompletion();

    const data = await req.json() // Parse the JSON body of the incoming request

    console.log(data);
    // Create a chat completion request to the OpenAI API

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
        model: 'llama3-8b-8192', // Specify the model to use
        stream: true, // Enable streaming responses
    })

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
            try {
                // Iterate over the streamed chunks of the response
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
                    if (content) {
                        const text = encoder.encode(content) // Encode the content to Uint8Array
                        controller.enqueue(text) // Enqueue the encoded text to the stream
                    }
                }
            } catch (err) {
                controller.error(err) // Handle any errors that occur during streaming
            } finally {
                controller.close() // Close the stream when done
            }
        },
    })

    return new NextResponse(stream) // Return the stream as the response
}