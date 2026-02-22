import pytest

from .factories import ConvenioFactory, ConvenioPlanFactory, ExamTypeFactory


@pytest.mark.django_db
class TestConvenio:
    def test_create_convenio(self):
        convenio = ConvenioFactory()
        assert convenio.pk is not None
        assert convenio.name
        assert convenio.is_active is True

    def test_str_representation(self):
        convenio = ConvenioFactory(name="Clínica Saúde Total")
        assert str(convenio) == "Clínica Saúde Total"

    def test_uuid_primary_key(self):
        convenio = ConvenioFactory()
        assert len(str(convenio.pk)) == 36

    def test_address_json_field(self):
        convenio = ConvenioFactory()
        assert isinstance(convenio.address, dict)
        assert "city" in convenio.address

    def test_soft_delete(self):
        convenio = ConvenioFactory()
        convenio.soft_delete()
        assert convenio.is_deleted is True


@pytest.mark.django_db
class TestConvenioPlan:
    def test_create_plan(self):
        plan = ConvenioPlanFactory()
        assert plan.pk is not None
        assert plan.price > 0

    def test_str_representation(self):
        plan = ConvenioPlanFactory(name="Professional", price=199.90)
        assert "Professional" in str(plan)


@pytest.mark.django_db
class TestExamType:
    def test_create_exam_type(self):
        exam = ExamTypeFactory()
        assert exam.pk is not None
        assert exam.convenio is not None

    def test_str_representation(self):
        exam = ExamTypeFactory()
        assert exam.convenio.name in str(exam)
