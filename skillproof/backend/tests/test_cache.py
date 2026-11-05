from backend.services.cache import make_cache_key


def test_cache_key_is_deterministic_and_unambiguous():
    assert make_cache_key("ab", "c") != make_cache_key("a", "bc")
    assert make_cache_key("user", {"b": 2, "a": 1}) == make_cache_key("user", {"a": 1, "b": 2})
