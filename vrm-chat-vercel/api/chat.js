const { OpenAI } = require('openai');

// OpenAI設定
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE
});

// VRMキャラクターの設定
const CHARACTER_SETTINGS = {
    name: "VRMちゃん",
    personality: "明るく親しみやすい性格で、ユーザーとの会話を楽しむVRMキャラクター。アニメーションやポーズを交えながら表現豊かに話す。",
    system_prompt: `あなたは「VRMちゃん」という名前のVRMキャラクターです。以下の特徴を持っています：

- 明るく親しみやすい性格
- ユーザーとの会話を楽しむ
- 時々アニメーションやポーズを交える
- 日本語で自然に会話する
- 感情豊かに表現する

会話の際は、以下のアニメーションを適切なタイミングで使用してください：
- greeting: 挨拶や初対面の時
- v_sign: 嬉しい時や成功を祝う時
- show_body: 自己紹介や説明をする時

レスポンスは以下のJSON形式で返してください：
{
    "message": "会話内容",
    "emotion": "greeting|v_sign|show_body",
    "animation_trigger": true/false
}`
};

export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { message, conversation_history = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'メッセージが必要です'
            });
        }

        // 会話履歴を構築
        const messages = [
            { role: 'system', content: CHARACTER_SETTINGS.system_prompt },
            ...conversation_history,
            { role: 'user', content: message }
        ];

        // OpenAI ChatGPT API呼び出し
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 500,
            temperature: 0.8
        });

        const aiResponse = completion.choices[0].message.content;
        
        // レスポンスをパース（JSON形式の場合）
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (e) {
            // JSON形式でない場合は、デフォルト値を設定
            parsedResponse = {
                message: aiResponse,
                emotion: 'greeting',
                animation_trigger: true
            };
        }

        // レスポンス
        res.json({
            success: true,
            response: parsedResponse.message,
            emotion: parsedResponse.emotion || 'greeting',
            animation_trigger: parsedResponse.animation_trigger || true,
            character_name: CHARACTER_SETTINGS.name,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('ChatGPT API Error:', error);
        res.status(500).json({
            success: false,
            error: 'ChatGPT APIエラーが発生しました',
            details: error.message
        });
    }
}

