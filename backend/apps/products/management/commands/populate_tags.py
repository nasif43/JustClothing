from django.core.management.base import BaseCommand
from taggit.models import Tag

class Command(BaseCommand):
    help = 'Populate initial tags for the platform'

    def handle(self, *args, **options):
        # Main category tags (displayed prominently on homepage)
        main_tags = [
            "Streetwear",
            "Gym wear", 
            "Formal wear",
            "Oversized fits",
        ]
        
        # Additional popular fashion tags
        additional_tags = [
            "vintage",
            "casual",
            "trendy", 
            "minimalist",
            "boho",
            "classic",
            "summer",
            "winter",
            "party",
            "office",
            "cotton",
            "denim",
            "black",
            "white",
            "colorful",
            "printed",
            "plain",
            "comfortable",
            "stylish",
            "affordable",
        ]
        
        all_tags = main_tags + additional_tags
        created_count = 0
        
        for tag_name in all_tags:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created tag: {tag_name}')
                )
            else:
                self.stdout.write(f'Tag already exists: {tag_name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(all_tags)} tags. '
                f'Created {created_count} new tags.'
            )
        ) 