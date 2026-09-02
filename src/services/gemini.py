from typing import List

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from src.config import Settings, get_settings
from src.models.schemas import CallAnalysis, InsightSynthesisOutput


class GeminiService:
    def __init__(self, settings: Settings = None):
        self.settings = settings or get_settings()
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.gemini_model,
            google_api_key=self.settings.google_api_key,
            temperature=0.2,
        )
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=self.settings.embedding_model,
            google_api_key=self.settings.google_api_key,
        )

    def analyze_call(self, transcript_text: str, call_id: str) -> CallAnalysis:
        structured = self.llm.with_structured_output(CallAnalysis)
        prompt = (
            f"Analyze this customer support call transcript.\n\n"
            f"Call ID: {call_id}\n\nTranscript:\n{transcript_text}\n\n"
            "Identify the primary reason and any upstream operational/product issue."
        )
        result: CallAnalysis = structured.invoke(prompt)
        result.call_id = call_id
        return result

    def synthesize_insight(self, cluster_theme: str, call_summaries: List[str]) -> InsightSynthesisOutput:
        structured = self.llm.with_structured_output(InsightSynthesisOutput)
        summaries = "\n".join(f"- {s}" for s in call_summaries)
        prompt = (
            f"Synthesize an actionable insight from these related support calls.\n\n"
            f"Theme: {cluster_theme}\n\nSummaries:\n{summaries}"
        )
        return structured.invoke(prompt)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return self.embeddings.embed_documents(texts)
