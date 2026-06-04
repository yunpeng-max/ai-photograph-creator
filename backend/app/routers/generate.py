from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.generation import Generation
from app.models.point_transaction import PointTransaction
from app.schemas.generation import (
    GenerationRequest,
    GenerationResponse,
    GenerationListResponse,
)
from app.services.points_service import deduct_points, add_points
from app.services.prompt_assembler import assemble_prompt
from app.services.image_generator import generate_image, save_image

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("", response_model=GenerationResponse)
async def generate(
    body: GenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check points balance
    if current_user.points_balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient points. Please upgrade your plan.",
        )

    # Assemble the professional prompt
    assembled_prompt = assemble_prompt(
        image_type=body.image_type,
        aspect_ratio=body.aspect_ratio,
        style=body.style,
        scene=body.scene,
        whitespace=body.whitespace,
        subject=body.subject,
        additional_requirements=body.additional_requirements,
    )

    # Create generation record first
    generation = Generation(
        user_id=current_user.id,
        image_type=body.image_type,
        aspect_ratio=body.aspect_ratio,
        style=body.style,
        scene=body.scene,
        whitespace=body.whitespace,
        subject=body.subject,
        additional_requirements=body.additional_requirements,
        assembled_prompt=assembled_prompt,
        status="pending",
        cost_points=1,
    )
    db.add(generation)
    await db.flush()  # Get the generation ID

    # Deduct points
    try:
        new_balance = await deduct_points(
            db,
            current_user,
            amount=1,
            reason="generation_cost",
            related_generation_id=generation.id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient points",
        )

    # Call OpenAI API
    try:
        image_bytes = await generate_image(assembled_prompt, body.aspect_ratio)
        image_url = await save_image(image_bytes)

        # Update generation record
        generation.status = "completed"
        generation.image_url = image_url
    except Exception as e:
        # Refund points on failure
        await add_points(
            db,
            current_user,
            amount=1,
            reason="generation_refund",
            related_generation_id=generation.id,
        )
        generation.status = "failed"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}",
        )

    await db.commit()
    await db.refresh(generation)

    return GenerationResponse(
        id=str(generation.id),
        status=generation.status,
        image_type=generation.image_type,
        aspect_ratio=generation.aspect_ratio,
        style=generation.style,
        scene=generation.scene,
        whitespace=generation.whitespace,
        subject=generation.subject,
        additional_requirements=generation.additional_requirements,
        assembled_prompt=generation.assembled_prompt,
        image_url=generation.image_url,
        cost_points=generation.cost_points,
        points_balance_after=new_balance,
        created_at=generation.created_at.isoformat(),
    )


@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_generation(
    generation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Generation).where(
            Generation.id == generation_id,
            Generation.user_id == current_user.id,
        )
    )
    generation = result.scalar_one_or_none()

    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found",
        )

    return GenerationResponse(
        id=str(generation.id),
        status=generation.status,
        image_type=generation.image_type,
        aspect_ratio=generation.aspect_ratio,
        style=generation.style,
        scene=generation.scene,
        whitespace=generation.whitespace,
        subject=generation.subject,
        additional_requirements=generation.additional_requirements,
        assembled_prompt=generation.assembled_prompt,
        image_url=generation.image_url,
        cost_points=generation.cost_points,
        points_balance_after=current_user.points_balance,
        created_at=generation.created_at.isoformat(),
    )


@router.get("", response_model=GenerationListResponse)
async def list_generations(
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size

    # Get total count
    count_result = await db.execute(
        select(Generation).where(Generation.user_id == current_user.id)
    )
    total = len(count_result.scalars().all())

    # Get paginated results
    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == current_user.id)
        .order_by(Generation.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    generations = result.scalars().all()

    items = [
        GenerationResponse(
            id=str(g.id),
            status=g.status,
            image_type=g.image_type,
            aspect_ratio=g.aspect_ratio,
            style=g.style,
            scene=g.scene,
            whitespace=g.whitespace,
            subject=g.subject,
            additional_requirements=g.additional_requirements,
            assembled_prompt=g.assembled_prompt,
            image_url=g.image_url,
            cost_points=g.cost_points,
            points_balance_after=current_user.points_balance,
            created_at=g.created_at.isoformat(),
        )
        for g in generations
    ]

    return GenerationListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
    )
