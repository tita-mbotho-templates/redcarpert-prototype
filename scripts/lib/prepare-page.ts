import { sitePages } from '../../src/data/site';
import { catalogueProducts } from '../../src/data/catalogue';
import { contentAdaptations } from '../../src/data/content-adaptations';
import { adaptSiteDocument } from '../../src/lib/content-adapter';
import { adaptHomepageBackgrounds } from '../../src/lib/homepage-backgrounds';
import { adaptHomepageCollectionYears } from '../../src/lib/homepage-collection-years';
import { adaptFooterSocials } from '../../src/lib/footer-social-adapter';
import { adaptLogo } from '../../src/lib/logo-adapter';
import { adaptNavigation } from '../../src/lib/navigation-adapter';
import { addHomepageFooter } from '../../src/lib/homepage-footer';
import { adaptFooterBranding } from '../../src/lib/footer-branding-adapter';
import { correctFooterLinks } from '../../src/lib/footer-link-corrections';
import { adaptCatalogue } from '../../src/lib/catalogue-adapter';
import { adaptEditorialDocument } from '../../src/lib/editorial-pages';
import { modernizeSiteIcons } from '../../src/lib/modern-icons';
import { createProductDetailPreview } from '../../src/lib/product-detail-preview';
import { siteMetadata } from '../../src/data/metadata';

/** Produce the existing approved page tree without touching its structure. */
export function preparePage(route: string) {
 const product = catalogueProducts.find(p=>p.previewRoute===route);
 let original = product ? createProductDetailPreview(sitePages['/product/arabella'],product) : route === '/digital-lookbook' ? {...sitePages['/about-us'],route,title:'Digital Lookbook | Redcarpert Wedding Dresses',description:'Interactive sample bridal lookbook for Mermaid and Ball Gown dresses, with a downloadable PDF.'} : sitePages[route];
 // Replace inherited Bridal Vanesa catalogue browser-tab metadata without
 // modifying any approved page structure, product card or visual style.
 const listingMetadata: Record<string, {title:string; description:string}> = {
  '/product': {
   title: 'Wedding Dresses | Redcarpert Wedding Dresses',
   description: 'Explore illustrative Mermaid and Ball Gown wedding dresses. Stock photographs are not confirmed Redcarpert inventory.',
  },
  '/product-category/mermaid': {
   title: 'Mermaid Wedding Dresses | Redcarpert',
   description: 'Browse illustrative Mermaid wedding dress photographs in the Redcarpert bridal collection preview.',
  },
  '/product-category/ball_gown': {
   title: 'Ball Gown Wedding Dresses | Redcarpert',
   description: 'Explore illustrative Ball Gown wedding dresses in the Redcarpert bridal collection preview.',
  },
 };
 if(Object.hasOwn(listingMetadata,route)) original={...original,...listingMetadata[route]};
 if(route === '/') original = {...original, title:siteMetadata.title, description:siteMetadata.description};
 if(['/about-us','/contact-us','/our-brides'].includes(route)) original = {...original,title:route==='/about-us'?'About Us | Redcarpert Wedding Dresses':route==='/contact-us'?'Contact Us | Redcarpert Wedding Dresses':'Our Brides | Redcarpert Wedding Dresses',description:route==='/about-us'?"Learn about Redcarpert's bridal collections and fitting enquiries.":route==='/contact-us'?'Contact and fitting enquiry information for the Redcarpert prototype.':'Bridal inspiration gallery using clearly labelled sample photography.'};
 const editorial = adaptEditorialDocument(adaptFooterBranding(correctFooterLinks(adaptLogo(adaptNavigation(addHomepageFooter(adaptHomepageBackgrounds(adaptHomepageCollectionYears(adaptSiteDocument(adaptCatalogue(adaptFooterSocials(original),catalogueProducts),contentAdaptations))),sitePages['/about-us']))))));
 // Final icon pass runs only after the canonical layout/branding guards.
 const document = modernizeSiteIcons(editorial);
 return {document, product};
}
