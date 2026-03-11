import { Injectable } from '@angular/core';
import hljs from 'highlight.js/lib/core';

import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';

@Injectable({ providedIn: 'root' })
export class HighlightService {
  private readonly registered = new Set<string>();

  constructor() {
    const languages: Record<string, any> = {
      json, typescript, javascript, xml, css, bash, python, java, yaml, sql,
    };
    for (const [name, lang] of Object.entries(languages)) {
      hljs.registerLanguage(name, lang);
      this.registered.add(name);
    }
    // Aliases
    this.registered.add('html'); // xml covers html
    this.registered.add('ts');
    this.registered.add('js');
    this.registered.add('sh');
    this.registered.add('shell');
    this.registered.add('yml');
    this.registered.add('py');
  }

  highlight(code: string, language: string): string | null {
    // Map common aliases to registered names
    const aliasMap: Record<string, string> = {
      html: 'xml',
      ts: 'typescript',
      js: 'javascript',
      sh: 'bash',
      shell: 'bash',
      yml: 'yaml',
      py: 'python',
    };
    const resolved = aliasMap[language] ?? language;
    if (!this.registered.has(language) && !hljs.getLanguage(resolved)) {
      return null;
    }
    return hljs.highlight(code, { language: resolved }).value;
  }
}
