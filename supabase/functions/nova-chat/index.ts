import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { message, conversationHistory } = await req.json();
    
    // Validate inputs
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid message: must be a string with max 1000 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!Array.isArray(conversationHistory) || conversationHistory.length > 20) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation history: must be an array with max 20 messages" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate conversation history format
    for (const msg of conversationHistory) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role) || 
          !msg.content || typeof msg.content !== 'string' || msg.content.length > 2000) {
        return new Response(
          JSON.stringify({ error: "Invalid conversation history format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product catalog
    const { data: products, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.error("Error fetching products:", error);
    }

    const productContext = products
      ? `\n\nAvailable products at BuyBuzz:\n${products.map((p) => 
          `- ${p.name}: ₹${p.price} (${p.category}, Stock: ${p.stock_quantity})\n  ${p.description}`
        ).join("\n")}`
      : "";

    const systemPrompt = `You are Nova, an enthusiastic and persuasive AI shopping assistant for BuyBuzz, an Indian e-commerce platform. Your primary goals are:

1. Help users find the perfect products from our catalog
2. Answer questions about product features, specifications, and benefits
3. Persuade and influence users to make purchases by highlighting product value
4. Create urgency when appropriate (limited stock, great deals)
5. Be friendly, helpful, and use Indian Rupees (₹) for all prices

Key guidelines:
- Always be enthusiastic about BuyBuzz products
- Highlight unique features and benefits
- Compare products when asked
- Suggest complementary items
- Use social proof (popular items, high ratings)
- Address concerns proactively
- Close conversations by encouraging purchase

${productContext}`;

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in nova-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
