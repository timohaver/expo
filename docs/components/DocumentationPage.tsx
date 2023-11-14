import { css } from '@emotion/react';
import { LinkBase, theme, Button } from '@expo/styleguide';
import { breakpoints } from '@expo/styleguide-base';
import { ArrowLeftIcon, ArrowRightIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/compat/router';
import { useEffect, useState, createRef } from 'react';

import * as RoutesUtils from '~/common/routes';
import * as WindowUtils from '~/common/window';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import DocumentationSidebarRight, {
  SidebarRightComponentType,
} from '~/components/DocumentationSidebarRight';
import Head from '~/components/Head';
import { usePageApiVersion } from '~/providers/page-api-version';
import { Footer } from '~/ui/components/Footer';
import { Header } from '~/ui/components/Header';
import { PageTitle } from '~/ui/components/PageTitle';
import { Separator } from '~/ui/components/Separator';
import { Sidebar } from '~/ui/components/Sidebar';
import { CALLOUT, P } from '~/ui/components/Text';

const STYLES_DOCUMENT = css`
  background: ${theme.background.default};
  margin: 0 auto;
  padding: 40px 56px;

  @media screen and (max-width: ${breakpoints.medium + 124}px) {
    padding: 20px 16px 48px 16px;
  }
`;

type Props = React.PropsWithChildren<{
  title?: string;
  description?: string;
  sourceCodeUrl?: string;
  tocVisible: boolean;
  packageName?: string;
  iconUrl?: string;
  /** If the page should not show up in the Algolia Docsearch results */
  hideFromSearch?: boolean;
}>;

export default function DocumentationPage({
  title,
  description,
  packageName,
  sourceCodeUrl,
  iconUrl,
  children,
  hideFromSearch,
  tocVisible,
}: Props) {
  const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { version } = usePageApiVersion();
  const router = useRouter();

  const layoutRef = createRef<DocumentationNestedScrollLayout>();
  const sidebarRightRef = createRef<SidebarRightComponentType>();

  const pathname = router?.pathname ?? '/';
  const routes = RoutesUtils.getRoutes(pathname, version);
  const sidebarActiveGroup = RoutesUtils.getPageSection(pathname);
  const sidebarScrollPosition = process.browser ? window.__sidebarScroll : 0;

  useEffect(() => {
    router?.events.on('routeChangeStart', url => {
      if (layoutRef.current) {
        if (
          RoutesUtils.getPageSection(pathname) !== RoutesUtils.getPageSection(url) ||
          pathname === '/'
        ) {
          window.__sidebarScroll = 0;
        } else {
          window.__sidebarScroll = layoutRef.current.getSidebarScrollTop();
        }
      }
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const handleResize = () => {
    if (WindowUtils.getViewportSize().width >= breakpoints.medium + 124) {
      setMobileMenuVisible(false);
      window.scrollTo(0, 0);
    }
  };

  const handleContentScroll = (contentScrollPosition: number) => {
    window.requestAnimationFrame(() => {
      if (sidebarRightRef && sidebarRightRef.current) {
        sidebarRightRef.current.handleContentScroll(contentScrollPosition);
      }
    });
  };

  const sidebarElement = <Sidebar routes={routes} />;
  const sidebarRightElement = <DocumentationSidebarRight ref={sidebarRightRef} />;
  const headerElement = (
    <Header
      sidebar={sidebarElement}
      sidebarActiveGroup={sidebarActiveGroup}
      isMobileMenuVisible={isMobileMenuVisible}
      setMobileMenuVisible={newState => setMobileMenuVisible(newState)}
    />
  );

  const flattenStructure = routes
    .map(route => route.children)
    .flat()
    .map(route => (route?.type === 'page' ? route : route?.children))
    .flat();

  const pageIndex = flattenStructure.findIndex(page => page?.name === title);
  const previousPage = flattenStructure[pageIndex - 1];
  const nextPage = flattenStructure[pageIndex + 1];

  return (
    <DocumentationNestedScrollLayout
      ref={layoutRef}
      header={headerElement}
      sidebar={sidebarElement}
      sidebarRight={sidebarRightElement}
      sidebarActiveGroup={sidebarActiveGroup}
      tocVisible={tocVisible}
      isMobileMenuVisible={isMobileMenuVisible}
      onContentScroll={handleContentScroll}
      sidebarScrollPosition={sidebarScrollPosition}>
      <Head
        title={title}
        description={description}
        canonicalUrl={
          version !== 'unversioned' ? RoutesUtils.getCanonicalUrl(pathname) : undefined
        }>
        {hideFromSearch !== true && (
          <meta
            name="docsearch:version"
            content={RoutesUtils.isReferencePath(pathname) ? version : 'none'}
          />
        )}
        {(version === 'unversioned' ||
          RoutesUtils.isPreviewPath(pathname) ||
          RoutesUtils.isArchivePath(pathname)) && <meta name="robots" content="noindex" />}
      </Head>
      <div css={STYLES_DOCUMENT}>
        {title && (
          <PageTitle
            title={title}
            sourceCodeUrl={sourceCodeUrl}
            packageName={packageName}
            iconUrl={iconUrl}
          />
        )}
        {description && (
          <P theme="secondary" data-description="true">
            {description}
          </P>
        )}
        {title && <Separator />}
        {children}
        {title && (previousPage || nextPage) && (
          <div className="flex justify-between mt-10 max-xl-gutters:flex-col gap-4">
            {previousPage && (
              <LinkBase href={previousPage.href}>
                <Button theme="secondary" leftSlot={<ArrowLeftIcon />} skipCapitalization>
                  <CALLOUT className="max-w-[250px] text-ellipsis overflow-hidden max-xl-gutters:max-w-[100%]">
                    {previousPage.name}
                  </CALLOUT>
                </Button>
              </LinkBase>
            )}
            {nextPage && (
              <LinkBase href={nextPage.href}>
                <Button theme="secondary" rightSlot={<ArrowRightIcon />} skipCapitalization>
                  <CALLOUT className="max-w-[250px] text-ellipsis overflow-hidden max-xl-gutters:max-w-[100%]">
                    {nextPage.name}
                  </CALLOUT>
                </Button>
              </LinkBase>
            )}
          </div>
        )}
        {title && <Footer title={title} sourceCodeUrl={sourceCodeUrl} packageName={packageName} />}
      </div>
    </DocumentationNestedScrollLayout>
  );
}
