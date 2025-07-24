// src/services/apiClient.ts
export async function analyzeDialogue(text: string) {
    const res = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  
    if (!res.ok) {
      throw new Error('분석 실패');
    }
  
    return res.json();
  }
  