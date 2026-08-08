import React, { useEffect } from 'react';
import Layout from '@theme/Layout';

// Using Docusaurus @site alias for clean imports
import { useExtractZip }     from '@site/src/hooks/useExtractZip';
import { useVersionCheck }   from '@site/src/hooks/useVersionCheck';
import { useUpload }         from '@site/src/hooks/useUpload';

import { DropZone }          from '@site/src/components/DropZone/DropZone';
import { ExtensionHeader }   from '@site/src/components/ExtensionHeader/ExtensionHeader';
import { TabView }           from '@site/src/components/TabView/TabView';
import { MarkdownViewer }    from '@site/src/components/MarkdownViewer/MarkdownViewer';
import { ConfigViewer }      from '@site/src/components/ConfigViewer/ConfigViewer';
import { UploadButton }      from '@site/src/components/UploadButton/UploadButton';

import type { Tab } from '@site/src/components/TabView/TabView';

import logoRotate from '../../icon/logo_rotate.png';

// You can move App.css content into Docusaurus's global custom.css, 
// or keep it as a CSS module and import it here.
import '@site/src/css/App.css'; 

export default function PublishExtensionPage() {
  const zip     = useExtractZip();
  const version = useVersionCheck();
  const upload  = useUpload();

  // Auto version-check when extraction completes
  useEffect(() => {
    if (zip.status === 'done' && zip.extracted) {
      const { id, version: v } = zip.extracted.manifest;
      version.check(id, v);
    }
  }, [zip.status, zip.extracted]);

  const handleBack = () => {
    zip.reset(); version.reset(); upload.reset();
  };

  // ── Build tabs from available content ─────────────────────────────────────
  const tabs: Tab[] = [];
  if (zip.extracted) {
    const { readmeContent, changelogContent, licenseContent, configSchema } = zip.extracted;

    if (readmeContent) {
      tabs.push({
        id: 'readme', label: 'README',
        content: <MarkdownViewer content={readmeContent} />,
      });
    }
    if (changelogContent) {
      tabs.push({
        id: 'changelog', label: 'CHANGELOG',
        content: <MarkdownViewer content={changelogContent} />,
      });
    }
    if (licenseContent) {
      tabs.push({
        id: 'license', label: 'LICENSE',
        content: (
          <pre style={{ fontFamily: 'monospace', fontSize: '12.5px', whiteSpace: 'pre-wrap',
            color: 'var(--ms-text-faded)', lineHeight: '1.6', margin: 0 }}>
            {licenseContent}
          </pre>
        ),
      });
    }
    if (configSchema && Object.keys(configSchema.properties ?? {}).length > 0) {
      tabs.push({
        id: 'configuration', label: 'Configuration',
        content: <ConfigViewer schema={configSchema} />,
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout 
      title="Publish Extension | MS Code Registry" 
      description="Upload and publish your MS Code extensions to the marketplace."
    >
      <div className="app-root">
        <div className="app-inner">

          {/* ── Brand header ─────────────────────────────────────────────── */}
          <div className="app-brand">
            <div className="app-brand-icon" aria-label="MS Code">
            	<img src={logoRotate} />
            </div>
            <div style={{lineHeight:1.1}}>
              <h1 className="app-brand-title">MS Code Registry</h1>
              <p className="app-brand-sub">Publish your extension to the marketplace</p>
            </div>
          </div>

          {/* ── Drop zone (only while no file is loaded) ─────────────────── */}
          {zip.status !== 'done' && (
            <DropZone
              onFile={zip.extract}
              loading={zip.status === 'reading'}
              error={zip.error}
            />
          )}

          {/* ── Extension detail view ─────────────────────────────────────── */}
          {zip.status === 'done' && zip.extracted && (
            <div className="app-detail">
              {/* Header */}
              <ExtensionHeader
                ext={zip.extracted}
                versionResult={version.result}
                versionLoading={version.loading}
                onBack={handleBack}
              />

              {/* Tabs (README / CHANGELOG / LICENSE / Configuration) */}
              {tabs.length > 0 ? (
                <TabView tabs={tabs} />
              ) : (
                <div className="app-no-docs">
                  No documentation files found inside the archive (README, CHANGELOG, LICENSE).
                </div>
              )}

              {/* Upload bar */}
              <UploadButton
                uploadStatus={upload.status}
                versionResult={version.result}
                versionLoading={version.loading}
                fileName={upload.fileName}
                error={upload.error}
                onUpload={() => zip.extracted && upload.upload(zip.extracted)}
              />
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}