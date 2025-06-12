from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _

class JustClothingAdminSite(AdminSite):
    # Text to put at the end of each page's <title>.
    site_title = _('JustClothing Admin')

    # Text to put in each page's <h1> (and above login form).
    site_header = _('JustClothing Administration')

    # Text to put at the top of the admin index page.
    index_title = _('Site Administration')

    # URL for the "View site" link at the top of each admin page.
    site_url = '/'

admin_site = JustClothingAdminSite(name='admin') 