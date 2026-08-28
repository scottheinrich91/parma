import { describe, it, expect } from 'vitest';
import {
  markdownToHtml,
  htmlToMarkdown,
  formatInline,
  getFormattedChildren,
  CALLOUT_CONFIG,
  parseHtmlStringToNodes,
} from '../../client/src/components/NoteEditor';
import {
  parseCustomCallouts,
  DEFAULT_CUSTOM_CALLOUT_CSS,
  STANDARD_CALLOUT_TYPES,
} from '../../client/src/customCallouts';

describe('Parma Visual Editor - Table Rendering & Round-Trip', () => {
  it('accurately parses GFM tables with header, separator alignments, and data rows in markdownToHtml', () => {
    const markdown = `| Header 1 | Header 2 | Header 3 |
| :--- | :---: | ---: |
| Left Val | Center Val | Right Val |`;

    const html = markdownToHtml(markdown);

    expect(html).toContain('<div class="table-wrapper">');
    expect(html).toContain('<table class="note-table">');
    expect(html).toContain('<th style="text-align: left;">Header 1</th>');
    expect(html).toContain('<th style="text-align: center;">Header 2</th>');
    expect(html).toContain('<th style="text-align: right;">Header 3</th>');
    expect(html).toContain('<td style="text-align: left;">Left Val</td>');
    expect(html).toContain('<td style="text-align: center;">Center Val</td>');
    expect(html).toContain('<td style="text-align: right;">Right Val</td>');
  });

  it('fills empty table cells with <br> in markdownToHtml so contentEditable cells can be clicked and edited', () => {
    const markdown = `| Col A | Col B |
| :--- | :--- |
| | Value B |
| Value A | |`;

    const html = markdownToHtml(markdown);
    expect(html).toContain('<td style="text-align: left;"><br></td>');
  });

  it('serializes table elements back to clean GFM tables preserving alignments and inline formatting in htmlToMarkdown', () => {
    const markdown = `| Column 1 | Column 2 | Column 3 |
| :--- | :---: | ---: |
| **Bold Item** | *Italic Item* | \`code\` |
| [[Recipes/Pasta#Flour|Pasta]] | Plain text | Final |`;

    const html = markdownToHtml(markdown);
    const roundTripped = htmlToMarkdown(html);

    expect(roundTripped).toContain('| Column 1 | Column 2 | Column 3 |');
    expect(roundTripped).toContain('| :--- | :---: | ---: |');
    expect(roundTripped).toContain('| **Bold Item** | *Italic Item* | `code` |');
    expect(roundTripped).toContain('| [[Recipes/Pasta#Flour|Pasta]] | Plain text | Final |');
  });
});

describe('Parma Visual Editor - Callouts', () => {
  it('supports all 23 standard callout types in CALLOUT_CONFIG', () => {
    const requiredTypes = [
      'note', 'tip', 'important', 'warning', 'caution', 'danger', 'success', 'info',
      'todo', 'done', 'question', 'help', 'faq', 'bug', 'example', 'quote', 'cite',
      'summary', 'tldr', 'abstract', 'failure', 'fail', 'missing'
    ];

    requiredTypes.forEach((type) => {
      expect(CALLOUT_CONFIG).toHaveProperty(type);
      expect(CALLOUT_CONFIG[type].icon).toBeDefined();
      expect(CALLOUT_CONFIG[type].border).toBeDefined();
      expect(CALLOUT_CONFIG[type].bg).toBeDefined();
      expect(CALLOUT_CONFIG[type].titleColor).toBeDefined();
      expect(CALLOUT_CONFIG[type].defaultTitle).toBeDefined();
    });
  });

  it('accurately parses and round-trips all 13 primary standard Obsidian callout types', () => {
    const standard13Types = [
      'note', 'abstract', 'info', 'todo', 'tip', 'success',
      'question', 'warning', 'failure', 'danger', 'bug', 'example', 'quote'
    ];

    standard13Types.forEach((type) => {
      const markdown = `> [!${type.toUpperCase()}] ${type.charAt(0).toUpperCase() + type.slice(1)} Title\n> Body content for ${type}.`;
      const html = markdownToHtml(markdown);

      expect(html).toContain('class="callout');
      expect(html).toContain(`data-callout-type="${type}"`);
      expect(html).toContain(`data-callout="${type}"`);
      expect(html).toContain(`data-callout-title="${type.charAt(0).toUpperCase() + type.slice(1)} Title"`);
      expect(html).toContain(`Body content for ${type}.`);

      const roundTripped = htmlToMarkdown(html);
      expect(roundTripped).toContain(`> [!${type.toUpperCase()}] ${type.charAt(0).toUpperCase() + type.slice(1)} Title`);
      expect(roundTripped).toContain(`> Body content for ${type}.`);
    });
  });

  it('parses > [!TYPE] with foldable modifier (+ and -), custom title, and sets contenteditable="false" on .callout-header', () => {
    // Test Expanded '+'
    const markdownExpanded = `> [!WARNING]+ Security Notice\n> Please keep your secret keys safe!\n> Do not commit them to public repos.`;
    const htmlExpanded = markdownToHtml(markdownExpanded);

    expect(htmlExpanded).toContain('class="callout');
    expect(htmlExpanded).toContain('data-callout-type="warning"');
    expect(htmlExpanded).toContain('data-callout-fold="+"');
    expect(htmlExpanded).toContain('data-callout-title="Security Notice"');
    expect(htmlExpanded).toContain('<div class="callout-header');
    expect(htmlExpanded).toContain('contenteditable="false"');
    expect(htmlExpanded).toContain('Security Notice');
    expect(htmlExpanded).toContain('Please keep your secret keys safe!');

    const roundTrippedExpanded = htmlToMarkdown(htmlExpanded);
    expect(roundTrippedExpanded).toContain('> [!WARNING]+ Security Notice');
    expect(roundTrippedExpanded).toContain('> Please keep your secret keys safe!');

    // Test Collapsed '-'
    const markdownCollapsed = `> [!NOTE]- Collapsed Note Details\n> Hidden body content until expanded.`;
    const htmlCollapsed = markdownToHtml(markdownCollapsed);

    expect(htmlCollapsed).toContain('data-callout-type="note"');
    expect(htmlCollapsed).toContain('data-callout-fold="-"');
    expect(htmlCollapsed).toContain('data-callout-title="Collapsed Note Details"');

    const roundTrippedCollapsed = htmlToMarkdown(htmlCollapsed);
    expect(roundTrippedCollapsed).toContain('> [!NOTE]- Collapsed Note Details');
    expect(roundTrippedCollapsed).toContain('> Hidden body content until expanded.');
  });

  it('correctly handles title-only callouts without inserting unnecessary empty body lines', () => {
    // 1. Simple title only
    const mdTitleOnly = `> [!TIP] Pro Tip Title`;
    const html1 = markdownToHtml(mdTitleOnly);
    expect(html1).toContain('data-callout-type="tip"');
    expect(html1).toContain('data-callout-title="Pro Tip Title"');
    const roundTripped1 = htmlToMarkdown(html1);
    expect(roundTripped1).toBe('> [!TIP] Pro Tip Title');

    // 2. Foldable title only with '+'
    const mdFoldableTitleOnlyPlus = `> [!NOTE]+ Expandable Header Only`;
    const html2 = markdownToHtml(mdFoldableTitleOnlyPlus);
    expect(html2).toContain('data-callout-type="note"');
    expect(html2).toContain('data-callout-fold="+"');
    const roundTripped2 = htmlToMarkdown(html2);
    expect(roundTripped2).toBe('> [!NOTE]+ Expandable Header Only');

    // 3. Foldable title only with '-'
    const mdFoldableTitleOnlyMinus = `> [!WARNING]- Collapsed Header Only`;
    const html3 = markdownToHtml(mdFoldableTitleOnlyMinus);
    expect(html3).toContain('data-callout-type="warning"');
    expect(html3).toContain('data-callout-fold="-"');
    const roundTripped3 = htmlToMarkdown(html3);
    expect(roundTripped3).toBe('> [!WARNING]- Collapsed Header Only');

    // 4. Default title only
    const mdDefaultTitleOnly = `> [!QUESTION]`;
    const html4 = markdownToHtml(mdDefaultTitleOnly);
    expect(html4).toContain('data-callout-type="question"');
    const roundTripped4 = htmlToMarkdown(html4);
    expect(roundTripped4).toBe('> [!QUESTION]');
  });

  it('accurately parses and round-trips custom callout types with hyphens and custom titles', () => {
    const customMarkdown = `> [!custom-question-type]+ Custom Questions Header\n> This is a custom Obsidian callout type.\n> Styled dynamically via CSS.`;
    const html = markdownToHtml(customMarkdown);

    expect(html).toContain('data-callout-type="custom-question-type"');
    expect(html).toContain('data-callout="custom-question-type"');
    expect(html).toContain('data-callout-fold="+"');
    expect(html).toContain('data-callout-title="Custom Questions Header"');
    expect(html).toContain('This is a custom Obsidian callout type.');

    const roundTripped = htmlToMarkdown(html);
    expect(roundTripped).toContain('> [!CUSTOM-QUESTION-TYPE]+ Custom Questions Header');
    expect(roundTripped).toContain('> This is a custom Obsidian callout type.');
    expect(roundTripped).toContain('> Styled dynamically via CSS.');
  });

  it('provides all 13 standard Obsidian types in STANDARD_CALLOUT_TYPES with labels, icons, and colors', () => {
    const expected13 = [
      'note', 'abstract', 'info', 'todo', 'tip', 'success',
      'question', 'warning', 'failure', 'danger', 'bug', 'example', 'quote'
    ];

    expect(STANDARD_CALLOUT_TYPES).toHaveLength(13);
    expected13.forEach((id) => {
      const found = STANDARD_CALLOUT_TYPES.find((t) => t.id === id);
      expect(found).toBeDefined();
      expect(found?.label).toBeDefined();
      expect(found?.icon).toBeDefined();
      expect(found?.color).toBeDefined();
    });
  });

  it('correctly parses custom callout CSS blocks into structured definitions', () => {
    const parsed = parseCustomCallouts(DEFAULT_CUSTOM_CALLOUT_CSS);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('custom-question-type');
    expect(parsed[0].name).toBe('Custom Question Type');
    expect(parsed[0].color).toBe('#000000');
    expect(parsed[0].iconName).toBe('alert-circle');

    const multiCss = `
      .callout[data-callout="custom-flame"] {
          --callout-color: #ff4500;
          --callout-icon: lucide-flame;
      }
      .callout[data-callout="vip-note"] {
          --callout-color: #9333ea;
          --callout-icon: lucide-star;
          --callout-title: "VIP Announcement";
      }
    `;

    const multiParsed = parseCustomCallouts(multiCss);
    expect(multiParsed).toHaveLength(2);
    expect(multiParsed[0].id).toBe('custom-flame');
    expect(multiParsed[0].color).toBe('#ff4500');
    expect(multiParsed[0].iconName).toBe('flame');

    expect(multiParsed[1].id).toBe('vip-note');
    expect(multiParsed[1].name).toBe('VIP Announcement');
    expect(multiParsed[1].color).toBe('#9333ea');
    expect(multiParsed[1].iconName).toBe('star');
  });

  it('extracts multi-paragraph callouts in htmlToMarkdown without squishing and prefixes each line with >', () => {
    const markdown = `> [!NOTE] Custom Note Title\n> First paragraph line 1.\n> First paragraph line 2.\n>\n> Second paragraph after empty line.`;

    const html = markdownToHtml(markdown);
    const roundTripped = htmlToMarkdown(html);

    expect(roundTripped).toContain('> [!NOTE] Custom Note Title');
    expect(roundTripped).toContain('> First paragraph line 1.');
    expect(roundTripped).toContain('> Second paragraph after empty line.');
    // Check that it did not merge into a single line
    const lines = roundTripped.split('\n');
    const noteLines = lines.filter((l) => l.startsWith('>'));
    expect(noteLines.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Parma Visual Editor - Inline Formatting & Wikilinks', () => {
  it('preserves wikilinks with headings ([[Target#Heading|Alias]]) in formatInline and htmlToMarkdown', () => {
    const textWithHeadingAndAlias = 'Check out [[Recipes/Pasta#Flour|Pasta Flour]] for details.';
    const html1 = formatInline(textWithHeadingAndAlias);
    expect(html1).toContain('data-target="Recipes/Pasta"');
    expect(html1).toContain('data-heading="Flour"');
    expect(html1).toContain('data-alias="Pasta Flour"');
    const md1 = htmlToMarkdown(html1);
    expect(md1).toContain('[[Recipes/Pasta#Flour|Pasta Flour]]');

    const textWithHeadingOnly = 'Check out [[Recipes/Pasta#Gluten Development]].';
    const html2 = formatInline(textWithHeadingOnly);
    expect(html2).toContain('data-target="Recipes/Pasta"');
    expect(html2).toContain('data-heading="Gluten Development"');
    const md2 = htmlToMarkdown(html2);
    expect(md2).toContain('[[Recipes/Pasta#Gluten Development]]');

    const textWithAliasOnly = 'Check out [[Recipes/Pasta|Artisanal Fresh Pasta]].';
    const html3 = formatInline(textWithAliasOnly);
    expect(html3).toContain('data-target="Recipes/Pasta"');
    expect(html3).toContain('data-alias="Artisanal Fresh Pasta"');
    const md3 = htmlToMarkdown(html3);
    expect(md3).toContain('[[Recipes/Pasta|Artisanal Fresh Pasta]]');

    const textSimple = 'Check out [[Index]].';
    const html4 = formatInline(textSimple);
    expect(html4).toContain('data-target="Index"');
    const md4 = htmlToMarkdown(html4);
    expect(md4).toContain('[[Index]]');
  });

  it('getFormattedChildren handles element children properly without squishing text', () => {
    const rawHtml = '<p>This is <strong>bold text</strong> and <em>italic text</em> with <code>code</code>.</p>';
    const node = parseHtmlStringToNodes(rawHtml);
    const formatted = getFormattedChildren(node);
    expect(formatted).toBe('This is **bold text** and *italic text* with `code`.\n\n');
  });
});
