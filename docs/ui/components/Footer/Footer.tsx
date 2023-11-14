import { LinkBase } from '@expo/styleguide';
import { ArrowLeftIcon, ArrowRightIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/compat/router';

import { ForumsLink, EditPageLink, IssuesLink } from './Links';

import { NavigationRoute } from '~/types/common';
import { NewsletterSignUp } from '~/ui/components/Footer/NewsletterSignUp';
import { PageVote } from '~/ui/components/Footer/PageVote';
import { P, FOOTNOTE, UL } from '~/ui/components/Text';

const NEWSLETTER_DISABLED = true as const;

type Props = {
  title: string;
  sourceCodeUrl?: string;
  packageName?: string;
  previousPage?: NavigationRoute & { section?: string };
  nextPage?: NavigationRoute & { section?: string };
};

export const Footer = ({ title, sourceCodeUrl, packageName, previousPage, nextPage }: Props) => {
  const router = useRouter();
  const isAPIPage = router?.pathname.includes('/sdk/') ?? false;
  const isExpoPackage = packageName && packageName.startsWith('expo-');

  return (
    <footer className="flex flex-col border-t border-default mt-10 pt-8 gap-8">
      {title && (previousPage || nextPage) && (
        <div className="grid grid-cols-2 max-xl-gutters:grid-cols-1 gap-4">
          {previousPage ? (
            <LinkBase
              href={previousPage.href}
              className="flex border items-center gap-3 border-solid border-default rounded-md py-3 px-4 w-full hocus:shadow-xs">
              <ArrowLeftIcon />
              <div>
                <FOOTNOTE theme="secondary">
                  Previous{previousPage.section ? ` (${previousPage.section})` : ''}
                </FOOTNOTE>
                <P weight="medium">{previousPage.sidebarTitle ?? previousPage.name}</P>
              </div>
            </LinkBase>
          ) : (
            <div />
          )}
          {nextPage ? (
            <LinkBase
              href={nextPage.href}
              className="flex border justify-between items-center gap-3 border-solid border-default rounded-md py-3 px-4 w-full hocus:shadow-xs">
              <div>
                <FOOTNOTE theme="secondary">
                  Next{nextPage?.section ? ` (${nextPage.section})` : ''}
                </FOOTNOTE>
                <P weight="medium">{nextPage.sidebarTitle ?? nextPage.name}</P>
              </div>
              <ArrowRightIcon />
            </LinkBase>
          ) : (
            <div />
          )}
        </div>
      )}
      <div className="flex flex-row max-md-gutters:flex-col">
        <UL className="flex-1 !mt-0 !ml-0 mb-5 !list-none">
          <ForumsLink isAPIPage={isAPIPage} title={title} />
          {isAPIPage && (
            <IssuesLink title={title} repositoryUrl={isExpoPackage ? undefined : sourceCodeUrl} />
          )}
          {router?.pathname && <EditPageLink pathname={router.pathname} />}
        </UL>
        <PageVote />
        {!NEWSLETTER_DISABLED && <NewsletterSignUp />}
      </div>
    </footer>
  );
};
