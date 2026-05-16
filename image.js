import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function required(value, fallback='') { return value || fallback; }

function buildPrompt(data) {
  return `你是金御賞公司的資深餐飲行銷總監與公關顧問。請根據以下資料，產出可直接使用的繁體中文行銷內容。

品牌：${required(data.brand)}
品牌定位：${required(data.brandProfile?.tag)}
品牌調性：${required(data.brandProfile?.style)}
行銷主題：${required(data.theme)}
目標客群：${required(data.audience)}
語氣風格：${required(data.tone)}
主要目標：${required(data.goal)}
活動期間：${required(data.period)}
門市/商場/區域：${required(data.location)}
活動內容/產品賣點/優惠方式：${required(data.brief)}
關鍵字：${required(data.keywords)}

請嚴格回傳 JSON，不要使用 markdown code block。JSON 格式如下：
{
  "social": "包含 Facebook 長文、Instagram 貼文、Threads 短文，各自分段清楚，含 hashtag",
  "press": "新聞稿：標題、副標、前言、活動內容、品牌觀點、媒體報導角度、聯絡資訊",
  "line": "LINE OA 推播、簡訊版本、會員分眾提醒",
  "video": "15秒短影音腳本、30秒短影音腳本、Reels/Shorts標題、字幕建議",
  "imagePrompt": "可貼到 ChatGPT / OpenAI Images / Canva / Midjourney 的圖片生成提示詞，包含構圖、光線、食物、風格、避免事項",
  "calendar": "7天或14天行銷排程，包含貼文、LINE、短影音、媒體與門市執行事項"
}

要求：
1. 不要誇大療效或使用不實承諾。
2. 適合台灣餐飲市場。
3. 金子半之助需保留江戶前天丼文化，但可以擴大客群。
4. 辻半需強調海鮮丼的豐盛、儀式感與海味層次。
5. 宇奈鰻魚飯需強調炭火香氣、秘傳醬汁、現烤鰻魚、職人手藝與日式鰻魚飯文化。
6. 金御賞集團需呈現日式餐飲品牌集團的專業形象。
7. 內容要能直接複製給行銷同仁使用。`;
}

function fallbackParse(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
  throw new Error('模型回傳格式不是 JSON，請再試一次');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY 尚未設定' });

  try {
    const data = req.body || {};
    const model = process.env.OPENAI_TEXT_MODEL || 'gpt-5.5';
    const response = await client.responses.create({
      model,
      input: buildPrompt(data)
    });
    const text = response.output_text || '';
    const parsed = fallbackParse(text);
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'OpenAI API 呼叫失敗' });
  }
}
