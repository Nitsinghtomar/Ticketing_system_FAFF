// server/src/services/qaService.ts - COMPLETE FIXED VERSION
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

export interface QARule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  weight: number;
  category: 'formatting' | 'content' | 'technical' | 'links';
}

export interface QAResult {
  score: number; // 1-10
  feedback: string;
  suggestions: string[];
  issues: QAIssue[];
  linkValidation?: LinkValidationResult[];
  ruleResults: RuleResult[];
  category: 'approved' | 'needs_revision' | 'rejected';
}

export interface QAIssue {
  ruleId: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

export interface LinkValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'unreachable';
  statusCode?: number;
  error?: string;
  redirectedTo?: string;
}

export interface RuleResult {
  ruleId: string;
  passed: boolean;
  score: number;
  feedback: string;
}

// QA Rules based on the formatting examples
export const DEFAULT_QA_RULES: QARule[] = [
  {
    id: 'formatting_consistency',
    name: 'Formatting Consistency',
    description: 'Checks for consistent use of bullet points, spacing, and structure',
    enabled: true,
    weight: 0.25,
    category: 'formatting'
  },
  {
    id: 'information_organization',
    name: 'Information Organization',
    description: 'Ensures information is well-organized with clear sections',
    enabled: true,
    weight: 0.20,
    category: 'formatting'
  },
  {
    id: 'content_completeness',
    name: 'Content Completeness',
    description: 'Verifies all necessary information is provided for user decision-making',
    enabled: true,
    weight: 0.20,
    category: 'content'
  },
  {
    id: 'clarity_conciseness',
    name: 'Clarity and Conciseness',
    description: 'Checks if content is clear, concise, and easy to scan',
    enabled: true,
    weight: 0.15,
    category: 'content'
  },
  {
    id: 'link_consistency',
    name: 'Link Consistency',
    description: 'Ensures links are properly formatted and consistently presented',
    enabled: true,
    weight: 0.10,
    category: 'links'
  },
  {
    id: 'professional_tone',
    name: 'Professional Tone',
    description: 'Maintains professional and helpful tone throughout',
    enabled: true,
    weight: 0.10,
    category: 'content'
  }
];

export class QAService {
  private anthropic: Anthropic | null;
  private rules: QARule[];

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY ;
    if (!apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not found, QA service will use mock responses');
      this.anthropic = null;
    } else {
      console.log('✅ ANTHROPIC_API_KEY found, QA service will use real AI responses');
      this.anthropic = new Anthropic({ apiKey });
    }
    
    this.rules = [...DEFAULT_QA_RULES];
  }

  // Main QA review method
  async performQAReview(
    messageContent: string, 
    taskContext: any, 
    conversationHistory: any[]
  ): Promise<QAResult> {
    try {
      console.log('🔍 Starting QA review for message', { 
        messageLength: messageContent.length,
        hasTaskContext: !!taskContext,
        historyLength: conversationHistory?.length || 0
      });

      // Ensure we have valid inputs
      if (!messageContent || typeof messageContent !== 'string') {
        throw new Error('Invalid message content provided');
      }

      // Ensure conversationHistory is an array
      const safeConversationHistory = Array.isArray(conversationHistory) ? conversationHistory : [];

      // 1. Extract links for validation
      const links = this.extractLinks(messageContent);
      
      // 2. Validate links if present
      let linkValidation: LinkValidationResult[] = [];
      if (links.length > 0) {
        linkValidation = await this.validateLinks(links);
      }

      // 3. Get AI analysis (with proper fallback)
      const aiAnalysis = await this.getAIAnalysisWithFallback(messageContent, taskContext, safeConversationHistory);

      // 4. Apply individual rules
      const ruleResults = await this.applyRules(messageContent, taskContext, aiAnalysis);

      // 5. Calculate overall score
      const overallScore = this.calculateOverallScore(ruleResults, linkValidation);

      // 6. Generate issues and suggestions
      const issues = this.generateIssues(ruleResults, linkValidation);
      const suggestions = this.generateSuggestions(issues, aiAnalysis);

      // 7. Determine category
      const category = this.determineCategory(overallScore, issues);

      const result: QAResult = {
        score: overallScore,
        feedback: aiAnalysis.overallFeedback,
        suggestions,
        issues,
        linkValidation: linkValidation.length > 0 ? linkValidation : undefined,
        ruleResults,
        category
      };

      console.log('✅ QA review completed', { 
        score: overallScore, 
        category,
        issuesCount: issues.length 
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ QA review failed', { error: errorMessage });
      throw new Error(`QA review failed: ${errorMessage}`);
    }
  }

  // Extract links from message content
  private extractLinks(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const matches = content.match(urlRegex) || [];
    return Array.from(new Set(matches));
  }

  // Validate links
  async validateLinks(urls: string[]): Promise<LinkValidationResult[]> {
    const results: LinkValidationResult[] = [];
    
    for (const url of urls) {
      try {
        const response = await axios.head(url, { 
          timeout: 5000,
          maxRedirects: 3,
          validateStatus: (status) => status < 400
        });
        
        results.push({
          url,
          status: 'valid',
          statusCode: response.status,
          redirectedTo: response.request.res?.responseUrl !== url ? 
            response.request.res?.responseUrl : undefined
        });
      } catch (error) {
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as any;
          results.push({
            url,
            status: 'invalid',
            statusCode: axiosError.response?.status,
            error: `HTTP ${axiosError.response?.status}: ${axiosError.response?.statusText}`
          });
        } else if (error instanceof Error) {
          results.push({
            url,
            status: 'unreachable',
            error: (error as any).code === 'ENOTFOUND' ? 'Domain not found' : 
                   (error as any).code === 'ETIMEDOUT' ? 'Request timeout' : 
                   error.message
          });
        } else {
          results.push({
            url,
            status: 'unreachable',
            error: 'Unknown error occurred'
          });
        }
      }
    }

    return results;
  }

  // Get AI analysis with proper fallback
  private async getAIAnalysisWithFallback(
    content: string, 
    taskContext: any, 
    conversationHistory: any[]
  ): Promise<any> {
    // If we don't have Anthropic API, use mock analysis
    if (!this.anthropic) {
      console.log('🤖 Using mock AI analysis (no API key)');
      return this.getMockAIAnalysis(content);
    }

    try {
      console.log('🤖 Using real Anthropic AI analysis');
      return await this.getAIAnalysis(content, taskContext, conversationHistory);
    } catch (error) {
      console.warn('⚠️ Anthropic API failed, falling back to mock analysis');
      return this.getMockAIAnalysis(content);
    }
  }

  // Get AI analysis using Claude (only called when anthropic is available)
  private async getAIAnalysis(
    content: string, 
    taskContext: any, 
    conversationHistory: any[]
  ): Promise<any> {
    const prompt = `You are a quality assurance specialist reviewing customer service responses. 

CONTEXT:
Task: ${taskContext?.title || 'Unknown task'}
Status: ${taskContext?.status || 'unknown'}
Requester: ${taskContext?.requester_name || 'Unknown'}

CONVERSATION HISTORY:
${conversationHistory.slice(-3).map(msg => `${msg.sender_name}: ${msg.content}`).join('\n')}

MESSAGE TO REVIEW:
${content}

Please analyze this message and provide quality scores (1-10) for each criterion.

Provide your analysis in this JSON format:
{
  "overallFeedback": "2-3 sentence summary of quality",
  "formattingScore": 8,
  "organizationScore": 7,
  "completenessScore": 8,
  "clarityScore": 9,
  "linkScore": 10,
  "toneScore": 8,
  "specificIssues": ["issue1", "issue2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const response = await this.anthropic!.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].type === 'text' ? 
      response.content[0].text : '';

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response, using fallback');
      return this.getMockAIAnalysis(content);
    }
  }

  // Mock AI analysis when no API key is available or API fails
  private getMockAIAnalysis(content: string): any {
    const hasLinks = /https?:\/\//.test(content);
    const hasContact = /@|phone|contact|\+\d/.test(content.toLowerCase());
    const hasQATrigger = /@QAreview/i.test(content);
    const isProfessional = !/\b(bad|terrible|awful|sucks)\b/i.test(content);
    const isDetailed = content.length > 100;
    const hasStructure = content.includes('\n') || content.includes('.') || content.includes(',');

    // Calculate base score based on content analysis
    let baseScore = 7; // Start with average
    if (isDetailed) baseScore += 0.5;
    if (hasContact) baseScore += 0.5;
    if (isProfessional) baseScore += 0.5;
    if (hasStructure) baseScore += 0.5;
    if (hasQATrigger) baseScore += 0.5; // Bonus for triggering QA
    
    baseScore = Math.min(10, Math.max(5, baseScore)); // Keep between 5-10

    return {
      overallFeedback: `Message demonstrates ${isProfessional ? 'professional' : 'casual'} communication with ${isDetailed ? 'good detail' : 'basic information'}. ${hasContact ? 'Contact information provided.' : ''} ${hasQATrigger ? 'QA review appropriately triggered.' : ''}`.trim(),
      formattingScore: hasStructure ? Math.round(baseScore) : Math.round(baseScore - 1),
      organizationScore: hasStructure ? Math.round(baseScore) : Math.round(baseScore - 0.5),
      completenessScore: hasContact ? Math.round(baseScore + 0.5) : Math.round(baseScore),
      clarityScore: isDetailed ? Math.round(baseScore) : Math.round(baseScore - 0.5),
      linkScore: hasLinks ? Math.round(baseScore) : 10, // No penalty for no links
      toneScore: isProfessional ? Math.round(baseScore + 0.5) : Math.round(baseScore - 1),
      specificIssues: !isProfessional ? ['Consider more professional language'] : [],
      improvements: !isDetailed ? ['Consider adding more specific details'] : ['Good level of detail provided']
    };
  }

  // Apply individual QA rules
  private async applyRules(
    content: string, 
    taskContext: any, 
    aiAnalysis: any
  ): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      let result: RuleResult;

      switch (rule.id) {
        case 'formatting_consistency':
          result = this.checkFormattingConsistency(content, aiAnalysis);
          break;
        case 'information_organization':
          result = this.checkInformationOrganization(content, aiAnalysis);
          break;
        case 'content_completeness':
          result = this.checkContentCompleteness(content, taskContext, aiAnalysis);
          break;
        case 'clarity_conciseness':
          result = this.checkClarityAndConciseness(content, aiAnalysis);
          break;
        case 'link_consistency':
          result = this.checkLinkConsistency(content, aiAnalysis);
          break;
        case 'professional_tone':
          result = this.checkProfessionalTone(content, aiAnalysis);
          break;
        default:
          result = {
            ruleId: rule.id,
            passed: true,
            score: 8,
            feedback: 'Rule not implemented'
          };
      }

      results.push(result);
    }

    return results;
  }

  // Individual rule implementations
  private checkFormattingConsistency(content: string, aiAnalysis: any): RuleResult {
    const score = aiAnalysis.formattingScore || 7;
    const hasStructure = content.includes('\n') || content.includes('•') || content.includes('-');
    
    return {
      ruleId: 'formatting_consistency',
      passed: score >= 7,
      score,
      feedback: hasStructure ? 'Good formatting structure' : 'Consider adding structure with bullet points or line breaks'
    };
  }

  private checkInformationOrganization(content: string, aiAnalysis: any): RuleResult {
    const score = aiAnalysis.organizationScore || 7;
    const hasLogicalFlow = content.length > 50 && !content.includes('...');
    
    return {
      ruleId: 'information_organization',
      passed: score >= 7,
      score,
      feedback: hasLogicalFlow ? 'Information is well organized' : 'Consider better organization of information'
    };
  }

  private checkContentCompleteness(content: string, taskContext: any, aiAnalysis: any): RuleResult {
    const score = aiAnalysis.completenessScore || 7;
    const hasContactInfo = /@|phone|\+\d|contact/i.test(content);
    const isDetailed = content.length > 100;
    
    return {
      ruleId: 'content_completeness',
      passed: score >= 7,
      score,
      feedback: (hasContactInfo && isDetailed) ? 'Complete information with contact details' : 
                hasContactInfo ? 'Good contact information provided' :
                isDetailed ? 'Good detail level' : 'Consider adding more complete information'
    };
  }

  private checkClarityAndConciseness(content: string, aiAnalysis: any): RuleResult {
    const score = aiAnalysis.clarityScore || 7;
    const tooLong = content.length > 1500;
    const isReasonable = content.length >= 20 && content.length <= 800;
    
    return {
      ruleId: 'clarity_conciseness',
      passed: score >= 7 && !tooLong,
      score: tooLong ? Math.max(score - 2, 1) : score,
      feedback: tooLong ? 'Message is too long, consider condensing' : 
                isReasonable ? 'Good clarity and length' : 'Consider appropriate message length'
    };
  }

  private checkLinkConsistency(content: string, aiAnalysis: any): RuleResult {
    const score = aiAnalysis.linkScore || 10;
    const links = this.extractLinks(content);
    
    if (links.length === 0) {
      return {
        ruleId: 'link_consistency',
        passed: true,
        score: 10,
        feedback: 'No links to validate'
      };
    }

    const allLinksValid = links.every(link => link.startsWith('http') && !link.includes(' '));
    
    return {
      ruleId: 'link_consistency',
      passed: score >= 7 && allLinksValid,
      score,
      feedback: allLinksValid ? 'Links are properly formatted' : 'Check link formatting'
    };
  }

  private checkProfessionalTone(content: string, aiAnalysis: any): RuleResult {
    const score = aiAnalysis.toneScore || 7;
    const hasProfessionalGreeting = /^(hi|hello|thanks|thank you)/i.test(content.trim());
    const hasHelpfulClosing = /(let me know|please|help|contact|reach out)/i.test(content.toLowerCase());
    const isPolite = !/(bad|terrible|awful|sucks|stupid)/i.test(content.toLowerCase());
    
    return {
      ruleId: 'professional_tone',
      passed: score >= 7,
      score,
      feedback: (hasProfessionalGreeting && hasHelpfulClosing && isPolite) ? 'Professional and helpful tone' :
                isPolite ? 'Good professional tone' : 'Consider more professional language'
    };
  }

  // Calculate overall score
  private calculateOverallScore(
    ruleResults: RuleResult[], 
    linkValidation: LinkValidationResult[]
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const result of ruleResults) {
      const rule = this.rules.find(r => r.id === result.ruleId);
      if (rule) {
        totalScore += result.score * rule.weight;
        totalWeight += rule.weight;
      }
    }

    const brokenLinks = linkValidation.filter(l => l.status !== 'valid').length;
    const linkPenalty = brokenLinks * 0.5;

    const baseScore = totalWeight > 0 ? totalScore / totalWeight : 7;
    const finalScore = Math.max(1, Math.min(10, baseScore - linkPenalty));

    return Math.round(finalScore * 10) / 10;
  }

  // Generate issues based on rule results
  private generateIssues(
    ruleResults: RuleResult[], 
    linkValidation: LinkValidationResult[]
  ): QAIssue[] {
    const issues: QAIssue[] = [];

    for (const result of ruleResults) {
      if (!result.passed || result.score < 7) {
        const rule = this.rules.find(r => r.id === result.ruleId);
        if (rule) {
          issues.push({
            ruleId: result.ruleId,
            severity: result.score < 5 ? 'high' : result.score < 7 ? 'medium' : 'low',
            message: `${rule.name}: ${result.feedback}`,
            suggestion: this.getSuggestionForRule(result.ruleId)
          });
        }
      }
    }

    for (const link of linkValidation) {
      if (link.status !== 'valid') {
        issues.push({
          ruleId: 'link_validation',
          severity: 'medium',
          message: `Link validation failed: ${link.url}`,
          suggestion: 'Check if the URL is correct and accessible'
        });
      }
    }

    return issues;
  }

  private getSuggestionForRule(ruleId: string): string {
    const suggestions: Record<string, string> = {
      'formatting_consistency': 'Use consistent bullet points and maintain proper spacing',
      'information_organization': 'Structure information with clear headers and logical grouping',
      'content_completeness': 'Include all necessary details and clear next steps',
      'clarity_conciseness': 'Break down long paragraphs for better readability',
      'link_consistency': 'Ensure all links are working and properly formatted',
      'professional_tone': 'Maintain helpful, professional language throughout'
    };

    return suggestions[ruleId] || 'Follow the style guide for best practices';
  }

  // Generate overall suggestions
  private generateSuggestions(issues: QAIssue[], aiAnalysis: any): string[] {
    const suggestions = new Set<string>();

    for (const issue of issues) {
      if (issue.suggestion) {
        suggestions.add(issue.suggestion);
      }
    }

    if (aiAnalysis.improvements && Array.isArray(aiAnalysis.improvements)) {
      for (const improvement of aiAnalysis.improvements) {
        suggestions.add(improvement);
      }
    }

    if (suggestions.size === 0) {
      suggestions.add('Message meets quality standards');
    }

    return Array.from(suggestions).slice(0, 5);
  }

  // Determine approval category
  private determineCategory(score: number, issues: QAIssue[]): 'approved' | 'needs_revision' | 'rejected' {
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;

    if (score >= 8 && highSeverityIssues === 0) {
      return 'approved';
    } else if (score >= 6 && highSeverityIssues <= 1) {
      return 'needs_revision';
    } else {
      return 'rejected';
    }
  }

  // Rule management methods
  getRules(): QARule[] {
    return [...this.rules];
  }

  updateRule(ruleId: string, updates: Partial<QARule>): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      return true;
    }
    return false;
  }

  addRule(rule: QARule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const qaService = new QAService();