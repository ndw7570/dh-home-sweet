from django.contrib import admin

from users.models import Person, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user_id", "display_name", "phone_number", "is_active", "is_deleted")
    search_fields = ("user_id", "first_name", "last_name", "phone_number")
    list_filter = ("is_active", "is_staff", "is_deleted")


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("person_id", "first_name", "last_name", "region", "user", "is_deleted")
    search_fields = ("first_name", "last_name", "region")
    list_filter = ("is_deleted",)
